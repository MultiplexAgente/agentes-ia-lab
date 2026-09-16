import { createFileRoute } from "@tanstack/react-router";

import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

/** Painel inicial: apenas contagens reais do banco desta empresa. Sem métrica fictícia. */
export const Route = createFileRoute("/api/company/overview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });

        const scoped = (table: string) =>
          supabase.from(table).select("id", { count: "exact", head: true }).eq("company_id", session.companyId);

        const [products, customers, conversations, messages, orders, channels] = await Promise.all([
          scoped("products"),
          scoped("customers"),
          scoped("conversations"),
          scoped("messages"),
          supabase.from("orders").select("total, status").eq("company_id", session.companyId).limit(1000),
          supabase
            .from("channels")
            .select("id, type, name, status, active")
            .eq("company_id", session.companyId)
            .limit(50),
        ]);

        const orderRows = (orders.data ?? []) as Array<{ total: number | string | null; status: string | null }>;
        const revenue = Number(orderRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0).toFixed(2));

        return Response.json({
          company: { id: session.companyId, name: session.companyName },
          user: { email: session.email, role: session.role },
          counts: {
            products: products.count ?? 0,
            customers: customers.count ?? 0,
            conversations: conversations.count ?? 0,
            messages: messages.count ?? 0,
            orders: orderRows.length,
          },
          revenue,
          ordersByStatus: orderRows.reduce<Record<string, number>>((acc, row) => {
            const key = row.status ?? "SEM_STATUS";
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
          }, {}),
          channels: channels.error ? [] : channels.data ?? [],
          channelsError: channels.error ? "Canais indisponíveis neste banco." : null,
        });
      },
    },
  },
});
