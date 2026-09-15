import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  MODEL_CATALOG,
  ROUTING_STRATEGIES,
  STRATEGY_LABELS,
  TASK_CATEGORIES,
  TASK_LABELS,
} from "@/lib/multiplex/router.server";
import { loadSettings, sanitizeSettings, saveSettings } from "@/lib/multiplex/settings.server";
import { getServiceClient, resolveCompanyId } from "@/lib/multiplex/supabase.server";

interface AuditRow {
  cost_usd: number | null;
  tokens_prompt: number | null;
  tokens_completion: number | null;
  latency_ms: number | null;
  model_used: string | null;
  task_category: string | null;
}

const SettingsSchema = z.object({
  companyId: z.string().max(64).optional(),
  settings: z.unknown(),
});

export const Route = createFileRoute("/api/admin/ai-routing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const url = new URL(request.url);
        const company = await resolveCompanyId(supabase, url.searchParams.get("companyId") ?? undefined);
        if (!company) {
          return Response.json({ error: "Nenhuma empresa ativa encontrada." }, { status: 400 });
        }

        const limit = Math.min(Number(url.searchParams.get("limit") ?? 50) || 50, 200);
        const { settings, persisted, error: settingsError } = await loadSettings(supabase, company.id);

        const { data: logs, error: logsError } = await supabase
          .from("ai_routing_audit")
          .select(
            "id, created_at, channel, task_category, complexity, strategy, model_selected, model_used, fallback_used, user_message, assistant_message, tokens_prompt, tokens_completion, cost_usd, cost_status, latency_ms, tools_used, context_sources, error",
          )
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(limit);

        const rows = (logs ?? []) as unknown as AuditRow[];
        const totals = rows.reduce(
          (acc, row) => {
            acc.calls += 1;
            acc.tokens += (row.tokens_prompt ?? 0) + (row.tokens_completion ?? 0);
            acc.costUsd += row.cost_usd ?? 0;
            acc.latencySum += row.latency_ms ?? 0;
            if (row.model_used) acc.byModel[row.model_used] = (acc.byModel[row.model_used] ?? 0) + 1;
            if (row.task_category) acc.byTask[row.task_category] = (acc.byTask[row.task_category] ?? 0) + 1;
            return acc;
          },
          { calls: 0, tokens: 0, costUsd: 0, latencySum: 0, byModel: {} as Record<string, number>, byTask: {} as Record<string, number> },
        );

        const { data: companies } = await supabase
          .from("companies")
          .select("id, name")
          .eq("active", true)
          .order("name", { ascending: true });

        return Response.json({
          company,
          companies: companies ?? [],
          settings,
          settingsPersisted: persisted,
          settingsError: settingsError ?? null,
          logs: logs ?? [],
          logsError: logsError?.message ?? null,
          summary: {
            calls: totals.calls,
            tokens: totals.tokens,
            costUsd: Number(totals.costUsd.toFixed(6)),
            avgLatencyMs: totals.calls ? Math.round(totals.latencySum / totals.calls) : 0,
            byModel: totals.byModel,
            byTask: totals.byTask,
          },
          catalog: {
            models: MODEL_CATALOG.map((model) => ({ id: model.id, tier: model.tier })),
            tasks: TASK_CATEGORIES.map((task) => ({ id: task, label: TASK_LABELS[task] })),
            strategies: ROUTING_STRATEGIES.map((strategy) => ({ id: strategy, label: STRATEGY_LABELS[strategy] })),
          },
        });
      },

      POST: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const parsed = SettingsSchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Requisição inválida." }, { status: 400 });
        }

        const company = await resolveCompanyId(supabase, parsed.data.companyId);
        if (!company) {
          return Response.json({ error: "Nenhuma empresa ativa encontrada." }, { status: 400 });
        }

        const settings = sanitizeSettings(parsed.data.settings);
        const result = await saveSettings(supabase, company.id, settings);
        if (!result.ok) {
          return Response.json({ error: result.error }, { status: 500 });
        }

        return Response.json({ settings, company });
      },
    },
  },
});
