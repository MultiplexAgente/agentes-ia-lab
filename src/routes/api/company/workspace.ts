import { createFileRoute } from "@tanstack/react-router";

import { COMMERCE_SEGMENTS, getSegmentConfig } from "@/lib/commerce/segments";
import { normalizeProductWithLegacy } from "@/lib/commerce/attributes";
import { loadCompanySegmentSettings } from "@/lib/commerce/company-segments";
import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import {
  MODEL_CATALOG,
  ROUTING_STRATEGIES,
  STRATEGY_LABELS,
  TASK_CATEGORIES,
  TASK_LABELS,
} from "@/lib/multiplex/router.server";
import { loadSettings } from "@/lib/multiplex/settings.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

export const Route = createFileRoute("/api/company/workspace")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) {
          return Response.json({ error: session.error }, { status: session.status });
        }

        const [{ data: categories }, { data: rawProducts }, settingsResult, segmentSettings] = await Promise.all([
          supabase
            .from("product_categories")
            .select("id, name, slug, active, sort_order")
            .eq("company_id", session.companyId)
            .order("sort_order", { ascending: true }),
          supabase
            .from("products")
            .select("*")
            .eq("company_id", session.companyId)
            .order("name", { ascending: true }),
          loadSettings(supabase, session.companyId),
          loadCompanySegmentSettings(supabase, session.companyId),
        ]);

        const products = (rawProducts ?? []).map((row: any) => {
          const itemSegment = row.segment || segmentSettings.primarySegment;
          return {
            id: row.id,
            category_id: row.category_id,
            name: row.name,
            description: row.description,
            price: row.price,
            available: row.available,
            segment: itemSegment,
            barcode_ean: row.barcode_ean ?? (row.segment_attributes as any)?.barcode_ean ?? null,
            sku: row.sku ?? null,
            unit_of_measure: row.unit_of_measure ?? (row.segment_attributes as any)?.unit_of_measure ?? "UN",
            current_stock: row.current_stock !== undefined ? Number(row.current_stock) : null,
            min_stock: row.min_stock !== undefined ? Number(row.min_stock) : null,
            ingredients: row.ingredients ?? [],
            preparation_time_minutes: row.preparation_time_minutes ?? 20,
            segment_attributes: normalizeProductWithLegacy(itemSegment, row),
          };
        });

        const { data: usage } = await supabase
          .from("ai_routing_audit")
          .select("tokens_prompt, tokens_completion, cost_usd, channel")
          .eq("company_id", session.companyId)
          .order("created_at", { ascending: false })
          .limit(200);

        const rows = (usage ?? []) as Array<{
          tokens_prompt: number | null;
          tokens_completion: number | null;
          cost_usd: number | null;
          channel: string | null;
        }>;

        return Response.json({
          company: {
            id: session.companyId,
            name: session.companyName,
            segment: segmentSettings.primarySegment,
            secondarySegments: segmentSettings.secondarySegments,
            activeSegments: segmentSettings.activeSegments,
          },
          user: { email: session.email, role: session.role },
          settings: settingsResult.settings,
          segmentSettings,
          availableSegments: COMMERCE_SEGMENTS.map((s) => getSegmentConfig(s)),
          categories: categories ?? [],
          products,
          usage: {
            calls: rows.length,
            tokens: rows.reduce((sum, r) => sum + (r.tokens_prompt ?? 0) + (r.tokens_completion ?? 0), 0),
            costUsd: Number(rows.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0).toFixed(6)),
            byChannel: rows.reduce<Record<string, number>>((acc, r) => {
              const key = r.channel ?? "web";
              acc[key] = (acc[key] ?? 0) + 1;
              return acc;
            }, {}),
          },
          catalog: {
            models: MODEL_CATALOG.map((model) => ({ id: model.id, tier: model.tier })),
            tasks: TASK_CATEGORIES.map((task) => ({ id: task, label: TASK_LABELS[task] })),
            strategies: ROUTING_STRATEGIES.map((s) => ({ id: s, label: STRATEGY_LABELS[s] })),
          },
        });
      },
    },
  },
});
