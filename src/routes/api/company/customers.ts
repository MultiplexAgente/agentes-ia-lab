import { createFileRoute } from "@tanstack/react-router";

import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

export const Route = createFileRoute("/api/company/customers")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });

        const term = (new URL(request.url).searchParams.get("q") ?? "").trim();
        let query = supabase
          .from("customers")
          .select("id, name, phone, email, total_orders, lifetime_value, created_at")
          .eq("company_id", session.companyId)
          .order("created_at", { ascending: false })
          .limit(200);
        if (term) query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);

        const { data, error } = await query;
        if (error) return Response.json({ error: "Não foi possível carregar os clientes." }, { status: 500 });
        return Response.json({ customers: data ?? [] });
      },

      POST: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });

        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        const name = typeof body["name"] === "string" ? body["name"].trim() : "";
        if (name.length < 2) return Response.json({ error: "Informe o nome do cliente." }, { status: 400 });

        const { data, error } = await supabase
          .from("customers")
          .insert({
            company_id: session.companyId,
            name,
            phone: typeof body["phone"] === "string" && body["phone"] ? body["phone"] : null,
            email: typeof body["email"] === "string" && body["email"] ? body["email"] : null,
            notes: typeof body["notes"] === "string" && body["notes"] ? body["notes"] : null,
          })
          .select("id, name, phone, email, created_at")
          .maybeSingle();
        if (error || !data) {
          return Response.json({ error: `Não foi possível cadastrar: ${error?.message ?? "erro desconhecido"}` }, { status: 500 });
        }
        return Response.json({ customer: data });
      },
    },
  },
});
