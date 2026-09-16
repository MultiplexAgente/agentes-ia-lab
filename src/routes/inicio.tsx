import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame, StateBlock, useCompanyData } from "@/components/multiplex/DataPage";
import { money } from "@/lib/multiplex/client";

interface Overview {
  company: { name: string };
  counts: { products: number; customers: number; conversations: number; messages: number; orders: number };
  revenue: number;
  ordersByStatus: Record<string, number>;
}

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Início | Multiplex" },
      { name: "description", content: "Panorama real da sua operação no Multiplex." },
      { property: "og:title", content: "Início | Multiplex" },
      { property: "og:description", content: "Panorama real da sua operação no Multiplex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data, error, loading } = useCompanyData<Overview>("/api/company/overview");

  return (
    <AppShell>
      <PageFrame title="Início" description={data?.company.name}>
        <StateBlock loading={loading} error={error} empty={!data} emptyText="Sem dados para exibir.">
          {data && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Produtos no catálogo", value: String(data.counts.products) },
                  { label: "Clientes cadastrados", value: String(data.counts.customers) },
                  { label: "Pedidos registrados", value: String(data.counts.orders) },
                  { label: "Faturamento registrado", value: money(data.revenue) },
                  { label: "Conversas", value: String(data.counts.conversations) },
                  { label: "Mensagens trocadas", value: String(data.counts.messages) },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl border border-border/60 bg-card/40 p-4">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="mt-1 font-display text-2xl font-semibold">{card.value}</p>
                  </div>
                ))}
              </div>
              {Object.keys(data.ordersByStatus).length > 0 && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Pedidos por situação</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(data.ordersByStatus).map(([status, count]) => (
                      <span key={status} className="rounded-full border border-border/60 px-3 py-1 text-xs">
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-6 text-xs text-muted-foreground">
                Todos os números vêm do banco de dados da sua empresa. Nada é estimado.
              </p>
            </>
          )}
        </StateBlock>
      </PageFrame>
    </AppShell>
  );
}
