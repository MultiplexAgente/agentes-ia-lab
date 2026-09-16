import { createFileRoute } from "@tanstack/react-router";

import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

export const Route = createFileRoute("/api/company/orders")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });

        const status = new URL(request.url).searchParams.get("status");
        let query = supabase
          .from("orders")
          .select(
            "id, status, subtotal, delivery_fee, total, payment_method, created_at, customers(id, name, phone), order_items(product_name, quantity, unit_price, item_total)",
          )
          .eq("company_id", session.companyId)
          .order("created_at", { ascending: false })
          .limit(100);
        if (status) query = query.eq("status", status);

        const { data, error } = await query;
        if (error) return Response.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 });
        return Response.json({ orders: data ?? [] });
      },
    },
  },
});
