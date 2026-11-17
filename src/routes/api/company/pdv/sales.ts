import { createFileRoute } from "@tanstack/react-router";
import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

export const Route = createFileRoute("/api/company/pdv/sales")({
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

        const url = new URL(request.url);
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 30)));

        const { data: sales, error } = await supabase
          .from("orders")
          .select("id, status, subtotal, total, payment_method, delivery_address, notes, created_at, customers(id, name)")
          .eq("company_id", session.companyId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({ sales: sales ?? [] });
      },
    },
  },
});
