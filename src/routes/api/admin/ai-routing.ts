import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { MODEL_CATALOG, STRATEGY_LABELS, TASK_LABELS } from "@/lib/multiplex/router.server";
import { loadSettings, sanitizeSettings, saveSettings } from "@/lib/multiplex/settings.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

const SettingsSchema = z.object({
  settings: z.object({
    strategy: z.enum(["QUALITY_FIRST", "BALANCED", "SPEED_FIRST", "COST_FIRST"]),
    categoryStrategies: z.record(z.enum(["QUALITY_FIRST", "BALANCED", "SPEED_FIRST", "COST_FIRST"])),
    modelPrices: z.record(
      z.object({
        input: z.number().nonnegative(),
        cachedInput: z.number().nonnegative().optional(),
        output: z.number().nonnegative(),
      }),
    ),
    monthlyBudgetUsd: z.number().nonnegative().nullable(),
    defaultModelAlias: z.enum(["gpt", "claude", "deepseek"]).optional(),
    autoModeEnabled: z.boolean().optional(),
  }),
});

function canAdmin(role: string): boolean {
  return role === "owner" || role === "admin";
}

export const Route = createFileRoute("/api/admin/ai-routing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco não configurado." }, { status: 503 });
        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });
        if (!canAdmin(session.role)) return Response.json({ error: "Acesso administrativo necessário." }, { status: 403 });

        const url = new URL(request.url);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 100), 1), 300);
        const [{ data: logs, error }, settingsResult] = await Promise.all([
          supabase.from("ai_routing_audit").select("*").eq("company_id", session.companyId).order("created_at", { ascending: false }).limit(limit),
          loadSettings(supabase, session.companyId),
        ]);
        if (error) return Response.json({ error: error.message }, { status: 500 });
        const rows = (logs ?? []) as Array<Record<string, unknown>>;
        const cleanLogs = rows.map((row) => {
          const {
            model_selected: _selected,
            model_used: _used,
            response_model: _responseModel,
            ...visible
          } = row;
          return {
            ...visible,
            // Dados técnicos ficam restritos ao administrador autenticado.
            model_used: _used,
            model_selected: _selected,
            response_model: _responseModel,
            engine: MODEL_CATALOG.find((model) => model.id === _used)?.tier ?? "balanced",
          };
        });
        return Response.json({
          company: { id: session.companyId, name: session.companyName },
          companies: [{ id: session.companyId, name: session.companyName }],
          logs: cleanLogs,
          summary: {
            calls: rows.length,
            tokens: rows.reduce((sum, row) => sum + Number(row["total_tokens"] ?? Number(row["tokens_prompt"] ?? 0) + Number(row["tokens_completion"] ?? 0)), 0),
            costUsd: rows.reduce((sum, row) => sum + Number(row["cost_usd"] ?? 0), 0),
            avgLatencyMs: rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row["latency_ms"] ?? 0), 0) / rows.length) : 0,
            byModel: {},
            byProvider: rows.reduce<Record<string, { calls: number; tokens: number; costUsd: number; fallbacks: number }>>((acc, row) => {
              const key = String(row["provider"] ?? "desconhecido");
              const entry = acc[key] ?? { calls: 0, tokens: 0, costUsd: 0, fallbacks: 0 };
              entry.calls += 1;
              entry.tokens += Number(row["total_tokens"] ?? 0);
              entry.costUsd += Number(row["cost_usd"] ?? 0);
              if (row["fallback_triggered"] === true) entry.fallbacks += 1;
              acc[key] = entry;
              return acc;
            }, {}),
            byTask: rows.reduce<Record<string, number>>((acc, row) => {
              const key = String(row["task_category"] ?? "geral");
              acc[key] = (acc[key] ?? 0) + 1;
              return acc;
            }, {}),
          },
          settings: settingsResult.settings,
          catalog: MODEL_CATALOG.map((model) => ({ id: model.id, tier: model.tier })),
          labels: { tasks: TASK_LABELS, strategies: STRATEGY_LABELS },
        });
      },
      POST: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco não configurado." }, { status: 503 });
        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });
        if (!canAdmin(session.role)) return Response.json({ error: "Acesso administrativo necessário." }, { status: 403 });
        const parsed = SettingsSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Configuração inválida." }, { status: 400 });
        const settings = sanitizeSettings(parsed.data.settings);
        const saved = await saveSettings(supabase, session.companyId, settings);
        return saved.error ? Response.json({ error: saved.error }, { status: 500 }) : Response.json({ settings });
      },
    },
  },
});