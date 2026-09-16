import type { SupabaseClient } from "@supabase/supabase-js";

import { ALIAS_PROVIDER, sanitizeAlias, type ModelAlias } from "./model-registry.server";

/** Preferência individual do usuário — guarda apenas o alias público. */
export async function loadUserAlias(
  supabase: SupabaseClient,
  companyId: string,
  userId: string | null | undefined,
): Promise<ModelAlias | null> {
  if (!userId) return null;
  const { data } = await supabase
    .from("user_ai_preferences")
    .select("primary_model_alias")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle();
  return sanitizeAlias((data as { primary_model_alias?: string } | null)?.primary_model_alias);
}

export async function saveUserAlias(
  supabase: SupabaseClient,
  companyId: string,
  userId: string,
  alias: ModelAlias,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("user_ai_preferences").upsert(
    {
      user_id: userId,
      company_id: companyId,
      primary_provider: ALIAS_PROVIDER[alias],
      primary_model_alias: alias,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,company_id" },
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}
