import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for the EXTERNAL Supabase project (Multiplex).
 * Never import this from client code.
 */
export function getServiceClient(): SupabaseClient | null {
  const url = process.env["MULTIPLEX_SUPABASE_URL"];
  const key = process.env["MULTIPLEX_SUPABASE_SECRET_KEY"];
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // sb_secret_* keys are opaque, not JWTs: PostgREST needs them on `apikey` only.
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Resolves the company for a request. A client-sent id is only accepted when it
 * matches a real active company row; otherwise the first active company is used.
 */
export async function resolveCompanyId(
  supabase: SupabaseClient,
  requested?: unknown,
): Promise<{ id: string; name: string } | null> {
  if (isUuid(requested)) {
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", requested)
      .eq("active", true)
      .maybeSingle();
    if (data) return data as { id: string; name: string };
  }

  const configured = process.env["MULTIPLEX_DEFAULT_COMPANY_ID"];
  if (isUuid(configured)) {
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .eq("id", configured)
      .maybeSingle();
    if (data) return data as { id: string; name: string };
  }

  const { data } = await supabase
    .from("companies")
    .select("id, name")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data as { id: string; name: string } | null) ?? null;
}
