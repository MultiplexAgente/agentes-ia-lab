import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame, StateBlock, useCompanyData } from "@/components/multiplex/DataPage";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/multiplex/client";

interface Order {
  id: string;
  status: string | null;
  subtotal: number | string | null;
  delivery_fee: number | string | null;
  total: number | string | null;
  created_at: string;
  customers: { id: string; name: string; phone: string | null } | null;
  order_items: Array<{ product_name: string; quantity: number; item_total: number | string }> | null;
}

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos | Multiplex" },
      { name: "description", content: "Pedidos reais registrados na sua operação." },
      { property: "og:title", content: "Pedidos | Multiplex" },
      { property: "og:description", content: "Pedidos reais registrados na sua operação." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data, error, loading } = useCompanyData<{ orders: Order[] }>("/api/company/orders");
  const rows = data?.orders ?? [];

  return (
    <AppShell>
      <PageFrame title="Pedidos" description={`${rows.length} pedido(s)`}>
        <StateBlock
          loading={loading}
          error={error}
          empty={rows.length === 0}
          emptyText="Nenhum pedido registrado. Peça ao Multiplex no chat: “quero criar um pedido”."
        >
          <div className="space-y-3">
            {rows.map((order) => (
              <div key={order.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{order.customers?.name ?? "Cliente removido"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{order.status ?? "SEM_STATUS"}</Badge>
                    <span className="font-display text-lg font-semibold">{money(order.total)}</span>
                  </div>
                </div>
                {order.order_items && order.order_items.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {order.order_items.map((item, index) => (
                      <li key={index} className="flex justify-between">
                        <span>
                          {item.quantity}× {item.product_name}
                        </span>
                        <span>{money(item.item_total)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </StateBlock>
      </PageFrame>
    </AppShell>
  );
}
