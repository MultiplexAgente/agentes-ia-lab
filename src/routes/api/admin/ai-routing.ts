import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { MODEL_CATALOG, STRATEGY_LABELS, TASK_LABELS } from "@/lib/multiplex/router.server";
import { loadSettings, saveSettings } from "@/lib/multiplex/settings.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

const SettingsSchema = z.object({
  settings: z.object({
    strategy: z.enum(["QUALITY_FIRST", "BALANCED", "SPEED_FIRST", "COST_FIRST"]),
    categoryStrategies: z.record(z.enum(["QUALITY_FIRST", "BALANCED", "SPEED_FIRST", "COST_FIRST"])),
    modelPrices: z.record(z.object({ input: z.number().nonnegative(), output: z.number().nonnegative() })),
    monthlyBudgetUsd: z.number().nonnegative().nullable(),
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
        const cleanLogs = rows.map((row) => ({
          ...row,
          model_selected: undefined,
          model_used: undefined,
          response_model: undefined,
          engine: (MODEL_CATALOG.find((model) => model.id === row["model_used"])?.tier ?? "balanced"),
        }));
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
        const saved = await saveSettings(supabase, session.companyId, parsed.data.settings);
        return saved.error ? Response.json({ error: saved.error }, { status: 500 }) : Response.json({ settings: parsed.data.settings });
      },
    },
  },
});