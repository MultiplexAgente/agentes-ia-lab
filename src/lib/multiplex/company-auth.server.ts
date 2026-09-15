import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface CompanySession {
  userId: string;
  email: string;
  companyId: string;
  companyName: string;
  role: string;
}

function publishableClient() {
  const url = process.env["MULTIPLEX_SUPABASE_URL"];
  const key = process.env["MULTIPLEX_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
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

/** Login por e-mail e senha no Supabase Auth da empresa. */
export async function signInCompanyUser(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string | null } | { error: string }> {
  const client = publishableClient();
  if (!client) return { error: "Autenticação não configurada no servidor." };

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return { error: error?.message ?? "E-mail ou senha inválidos." };
  }
  return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token ?? null };
}

/**
 * Valida o bearer token da requisição e devolve a empresa do usuário.
 * A empresa vem SEMPRE do vínculo em company_users — nunca do corpo do pedido.
 */
export async function requireCompanySession(
  supabase: SupabaseClient,
  request: Request,
): Promise<CompanySession | { error: string; status: number }> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return { error: "Faça login para continuar.", status: 401 };

  const { data, error } = await supabase.auth.getUser(token);
  const user = data?.user;
  if (error || !user) return { error: "Sessão expirada. Faça login novamente.", status: 401 };

  const { data: link } = await supabase
    .from("company_users")
    .select("company_id, role, active, companies(id, name)")
    .or(`user_id.eq.${user.id},email.eq.${user.email ?? ""}`)
    .eq("active", true)
    .maybeSingle();

  const row = link as
    | { company_id: string; role: string; companies?: { id: string; name: string } | null }
    | null;

  if (!row) {
    return { error: "Seu usuário ainda não está vinculado a uma empresa.", status: 403 };
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    companyId: row.company_id,
    companyName: row.companies?.name ?? "Minha empresa",
    role: row.role,
  };
}
