import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEFAULT_SETTINGS,
  ROUTING_STRATEGIES,
  TASK_CATEGORIES,
  type RoutingSettings,
  type RoutingStrategy,
  type TaskCategory,
} from "./router.server";

interface SettingsRow {
  company_id: string;
  strategy: string | null;
  category_strategies: Record<string, string> | null;
  model_prices: Record<string, { input: number; output: number }> | null;
  monthly_budget_usd: number | null;
}

function sanitizeStrategy(value: unknown): RoutingStrategy | null {
  return ROUTING_STRATEGIES.includes(value as RoutingStrategy) ? (value as RoutingStrategy) : null;
}

export function sanitizeSettings(input: unknown): RoutingSettings {
  const raw = (input ?? {}) as Record<string, unknown>;
  const categoryStrategies: Partial<Record<TaskCategory, RoutingStrategy>> = {};
  const rawCategories = (raw["categoryStrategies"] ?? raw["category_strategies"] ?? {}) as Record<string, unknown>;

  for (const category of TASK_CATEGORIES) {
    const strategy = sanitizeStrategy(rawCategories[category]);
    if (strategy) categoryStrategies[category] = strategy;
  }

  const modelPrices: RoutingSettings["modelPrices"] = {};
  const rawPrices = (raw["modelPrices"] ?? raw["model_prices"] ?? {}) as Record<string, unknown>;
  for (const [model, price] of Object.entries(rawPrices)) {
    const entry = price as { input?: unknown; output?: unknown } | null;
    const input = Number(entry?.input ?? 0);
    const output = Number(entry?.output ?? 0);
    if (Number.isFinite(input) && Number.isFinite(output) && (input > 0 || output > 0)) {
      modelPrices[model] = { input, output };
    }
  }

  const budgetRaw = raw["monthlyBudgetUsd"] ?? raw["monthly_budget_usd"];
  const budget = budgetRaw === null || budgetRaw === undefined || budgetRaw === "" ? null : Number(budgetRaw);

  return {
    strategy: sanitizeStrategy(raw["strategy"]) ?? DEFAULT_SETTINGS.strategy,
    categoryStrategies: Object.keys(categoryStrategies).length ? categoryStrategies : DEFAULT_SETTINGS.categoryStrategies,
    modelPrices,
    monthlyBudgetUsd: budget !== null && Number.isFinite(budget) && budget > 0 ? budget : null,
  };
}

export async function loadSettings(
  supabase: SupabaseClient,
  companyId: string,
): Promise<{ settings: RoutingSettings; persisted: boolean; error?: string }> {
  const { data, error } = await supabase
    .from("ai_routing_settings")
    .select("company_id, strategy, category_strategies, model_prices, monthly_budget_usd")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    return { settings: DEFAULT_SETTINGS, persisted: false, error: error.message };
  }
  if (!data) {
    return { settings: DEFAULT_SETTINGS, persisted: false };
  }

  const row = data as SettingsRow;
  return {
    settings: sanitizeSettings({
      strategy: row.strategy,
      category_strategies: row.category_strategies,
      model_prices: row.model_prices,
      monthly_budget_usd: row.monthly_budget_usd,
    }),
    persisted: true,
  };
}

export async function saveSettings(
  supabase: SupabaseClient,
  companyId: string,
  settings: RoutingSettings,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("ai_routing_settings").upsert(
    {
      company_id: companyId,
      strategy: settings.strategy,
      category_strategies: settings.categoryStrategies,
      model_prices: settings.modelPrices,
      monthly_budget_usd: settings.monthlyBudgetUsd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "company_id" },
  );

  return error ? { ok: false, error: error.message } : { ok: true };
}
