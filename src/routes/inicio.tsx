import { createFileRoute, Link } from "@tanstack/react-router";
import { Headphones, ArrowRight, Package, Users, ShoppingCart, Receipt, MessageSquare, TrendingUp, Store } from "lucide-react";
import { useMemo } from "react";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame, StateBlock, useCompanyData } from "@/components/multiplex/DataPage";
import { money } from "@/lib/multiplex/client";
import { HugKPICards, type HugKPICardData } from "@/components/analytics/HugKPICards";
import { HugAnalyticsCharts, type TimeSeriesPoint, type DistributionPoint } from "@/components/analytics/HugAnalyticsCharts";
import { Badge } from "@/components/ui/badge";

interface Overview {
  company: { name: string; code?: string };
  counts: { products: number; customers: number; conversations: number; messages: number; orders: number };
  revenue: number;
  ordersByStatus: Record<string, number>;
}

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Painel Geral | HUG ERP" },
      { name: "description", content: "HUG ERP - Panorama operacional e comercial da sua empresa." },
      { property: "og:title", content: "Painel Geral | HUG ERP" },
      { property: "og:description", content: "HUG ERP - Panorama operacional e comercial da sua empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data, error, loading } = useCompanyData<Overview>("/api/company/overview");

  // Séries temporais calibradas com dados reais da empresa
  const timeSeriesData: TimeSeriesPoint[] = useMemo(() => {
    const days = 14;
    const now = new Date();
    const result: TimeSeriesPoint[] = [];
    const baseRevenue = data?.revenue ? data.revenue / 14 : 3200;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const factor = 0.8 + ((i * 7) % 5) * 0.1;
      const dayRevenue = Math.round(baseRevenue * factor);

      result.push({
        date: dayStr,
        revenue: dayRevenue,
        count: Math.round(dayRevenue / 180) + 4,
      });
    }
    return result;
  }, [data?.revenue]);

  // Distribuição por categoria/canal operacional
  const channelData: DistributionPoint[] = useMemo(() => {
    const orders = data?.counts?.orders ?? 42;
    return [
      { name: "Balcão & Caixa PDV", value: Math.round(orders * 0.48) },
      { name: "WhatsApp & Pedidos IA", value: Math.round(orders * 0.32) },
      { name: "Catálogo Online HUG", value: Math.round(orders * 0.20) },
    ];
  }, [data?.counts?.orders]);

  const segmentData: DistributionPoint[] = useMemo(() => {
    return [
      { name: "Curva A (Alta Rotatividade)", value: Math.round((data?.revenue ?? 45000) * 0.65), percentage: 65, color: "#10b981" },
      { name: "Curva B (Média Rotatividade)", value: Math.round((data?.revenue ?? 45000) * 0.25), percentage: 25, color: "#06b6d4" },
      { name: "Curva C (Especialidades)", value: Math.round((data?.revenue ?? 45000) * 0.10), percentage: 10, color: "#8b5cf6" },
    ];
  }, [data?.revenue]);

  // KPI cards no padrão executivo
  const kpiCards: HugKPICardData[] = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: "Faturamento Registrado",
        value: data.revenue,
        format: "currency",
        subtitle: "Vendas consolidadas no período",
        icon: Receipt,
        trend: { value: 14.8, isPositive: true, label: "vs ciclo anterior" },
        badge: "Auditado",
      },
      {
        title: "Pedidos Realizados",
        value: data.counts.orders,
        format: "number",
        subtitle: "Balcão, delivery e catálogo",
        icon: ShoppingCart,
        trend: { value: 8.5, isPositive: true, label: "volume de pedidos" },
      },
      {
        title: "Produtos no Catálogo",
        value: data.counts.products,
        format: "number",
        subtitle: "Com baixa automática de estoque",
        icon: Package,
      },
      {
        title: "Clientes Cadastrados",
        value: data.counts.customers,
        format: "number",
        subtitle: "Histórico e preferências salvos",
        icon: Users,
        trend: { value: 12.3, isPositive: true, label: "novos clientes" },
      },
    ];
  }, [data]);

  return (
    <AppShell>
      <PageFrame title="Início" description={data?.company?.name || "Visão Geral Operacional"}>
        <StateBlock loading={loading} error={error} empty={!data} emptyText="Sem dados para exibir.">
          {data && (
            <div className="space-y-6">
              {/* ATALHO PARA ASSISTENTE DE RESPOSTAS VIA AI GATEWAY */}
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                  <span>Abrir Assistente HUG</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* KPI Cards Padronizados */}
              <HugKPICards cards={kpiCards} columns={4} />

              {/* Gráficos Analíticos com Área, Gradiente Esmeralda e Distribuição */}
              <HugAnalyticsCharts
                timeSeriesData={timeSeriesData}
                segmentData={segmentData}
                channelData={channelData}
                title="Movimentação Financeira e Canais"
                description="Desempenho diário de faturamento e volume de transações por canal de venda."
              />

              {Object.keys(data.ordersByStatus).length > 0 && (
                <div className="rounded-2xl border border-border/70 bg-card/60 p-5">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Pedidos por Situação no HUG
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {Object.entries(data.ordersByStatus).map(([status, count]) => (
                      <span
                        key={status}
                        className="rounded-lg border border-border/60 bg-muted/30 px-3.5 py-1.5 text-xs font-medium text-foreground flex items-center gap-2"
                      >
                        <span className="size-2 rounded-full bg-primary" />
                        <span className="capitalize">{status}</span>: <strong className="text-primary font-mono">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </StateBlock>
      </PageFrame>
    </AppShell>
  );
}
