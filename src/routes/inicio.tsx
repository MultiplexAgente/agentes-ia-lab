import { createFileRoute, Link } from "@tanstack/react-router";
import { Headphones, ArrowRight } from "lucide-react";

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
      { title: "Painel Geral | HUG ERP" },
      { name: "description", content: "HUG ERP - Panorama operacional e comercial da sua empresa by BonaSoft." },
      { property: "og:title", content: "Painel Geral | HUG ERP" },
      { property: "og:description", content: "HUG ERP - Panorama operacional e comercial da sua empresa by BonaSoft." },
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
              {/* ATALHO PARA ASSISTENTE DE RESPOSTAS VIA AI GATEWAY */}
              <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Dúvida de cliente no balcão ou WhatsApp?
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Gere uma resposta recomendada com base nas regras do seu negócio via AI Gateway.
                    </p>
                  </div>
                </div>
                <Link
                  to="/respostas-ia"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm shrink-0"
                >
                  <span>Abrir Assistente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

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
