import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Download,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";

export interface TimeSeriesPoint {
  date: string;
  revenue: number;
  count: number;
}

export interface DistributionPoint {
  name: string;
  value: number;
  color?: string | undefined;
  percentage?: number | undefined;
}

export interface ColoredDistributionItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface HugAnalyticsChartsProps {
  timeSeriesData: TimeSeriesPoint[];
  segmentDistribution?: DistributionPoint[] | undefined;
  segmentData?: DistributionPoint[] | undefined;
  channelDistribution?: DistributionPoint[] | undefined;
  channelData?: DistributionPoint[] | undefined;
  isLoading?: boolean | undefined;
  title?: string | undefined;
  description?: string | undefined;
  onExportCsv?: (() => void) | undefined;
}

const DEFAULT_COLORS = [
  "#10b981", // emerald
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#14b8a6", // teal
  "#6366f1", // indigo
];

export const HugAnalyticsCharts: React.FC<HugAnalyticsChartsProps> = ({
  timeSeriesData,
  segmentDistribution,
  segmentData,
  channelDistribution,
  channelData,
  isLoading = false,
  title = "Desempenho Comercial & Operacional",
  description = "Acompanhamento diário de faturamento e volume de atendimentos",
  onExportCsv,
}) => {
  const [metricType, setMetricType] = useState<"revenue" | "count">("revenue");

  const segments: DistributionPoint[] = segmentData ?? segmentDistribution ?? [];
  const channels: DistributionPoint[] = channelData ?? channelDistribution ?? [];

  const totals = useMemo(() => {
    const totalRev = timeSeriesData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalCount = timeSeriesData.reduce((acc, curr) => acc + curr.count, 0);
    const avgRev = timeSeriesData.length > 0 ? totalRev / timeSeriesData.length : 0;
    return { totalRev, totalCount, avgRev };
  }, [timeSeriesData]);

  const coloredSegments = useMemo<ColoredDistributionItem[]>(() => {
    const total = segments.reduce((sum, item) => sum + item.value, 0);
    return segments.map((item, index) => {
      const fallbackColor = DEFAULT_COLORS[index % DEFAULT_COLORS.length] as string;
      const pct = item.percentage ?? (total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0);
      return {
        name: item.name,
        value: item.value,
        color: item.color || fallbackColor,
        percentage: pct,
      };
    });
  }, [segments]);

  const coloredChannels = useMemo<ColoredDistributionItem[]>(() => {
    const total = channels.reduce((sum, item) => sum + item.value, 0);
    return channels.map((item, index) => {
      const fallbackColor = DEFAULT_COLORS[(index + 2) % DEFAULT_COLORS.length] as string;
      const pct = item.percentage ?? (total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0);
      return {
        name: item.name,
        value: item.value,
        color: item.color || fallbackColor,
        percentage: pct,
      };
    });
  }, [channels]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleExport = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    const header = "Data,Faturamento (R$),Atendimentos\n";
    const rows = timeSeriesData.map((d) => `"${d.date}",${d.revenue},${d.count}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `hug-relatorio-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Skeleton className="lg:col-span-8 h-[400px] rounded-2xl" />
        <Skeleton className="lg:col-span-4 h-[400px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico Principal: Área com Gradiente Esmeralda/Ciano */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <Card className="lg:col-span-8 border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 pb-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="size-5 text-emerald-500" />
                {title}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {description}
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMetricType("revenue")}
                  className={`rounded-md px-3 py-1 font-medium transition-all ${
                    metricType === "revenue"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Faturamento
                </button>
                <button
                  type="button"
                  onClick={() => setMetricType("count")}
                  className={`rounded-md px-3 py-1 font-medium transition-all ${
                    metricType === "count"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Volume / Pedidos
                </button>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="h-8 text-xs gap-1.5 border-border hover:bg-muted font-medium"
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="h-[280px] sm:h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeSeriesData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="hugEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="hugCyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.08)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    dy={5}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(val: number) =>
                      metricType === "revenue"
                        ? val >= 1000
                          ? `R$ ${(val / 1000).toFixed(0)}k`
                          : `R$ ${val}`
                        : String(val)
                    }
                    width={55}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length || !payload[0]) return null;
                      const point = payload[0].payload as TimeSeriesPoint;
                      return (
                        <div className="rounded-xl border border-border bg-popover/95 p-3 shadow-xl backdrop-blur-md text-xs">
                          <p className="font-semibold text-foreground border-b border-border/50 pb-1 mb-1.5">
                            {label}
                          </p>
                          <div className="space-y-1">
                            <p className="flex justify-between gap-4 text-emerald-400 font-medium">
                              <span>Faturamento:</span>
                              <strong>{formatCurrency(point.revenue)}</strong>
                            </p>
                            <p className="flex justify-between gap-4 text-cyan-400 font-medium">
                              <span>Operações:</span>
                              <strong>{point.count} atendimentos</strong>
                            </p>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={metricType === "revenue" ? "revenue" : "count"}
                    stroke={metricType === "revenue" ? "#10b981" : "#06b6d4"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${metricType === "revenue" ? "hugEmeraldGrad" : "hugCyanGrad"})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-muted-foreground">Total Acumulado</p>
                <p className="font-bold text-sm text-foreground mt-0.5">
                  {formatCurrency(totals.totalRev)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Média Diária</p>
                <p className="font-bold text-sm text-foreground mt-0.5">
                  {formatCurrency(totals.avgRev)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total de Atendimentos</p>
                <p className="font-bold text-sm text-foreground mt-0.5">
                  {totals.totalCount.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico Secundário: Donut de Distribuição por Categoria / Segmento */}
        <Card className="lg:col-span-4 border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <PieIcon className="size-4 text-cyan-500" />
              Distribuição por Categoria
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Participação no faturamento total
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coloredSegments}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {coloredSegments.map((entry: ColoredDistributionItem, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [
                      val >= 100 ? formatCurrency(val) : `${val}%`,
                      "Volume",
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
              {coloredSegments.map((item: ColoredDistributionItem) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground font-mono">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Terciário: Canais Comerciais (se disponível) */}
      {coloredChannels && coloredChannels.length > 0 && (
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-violet-500" />
              Desempenho por Canal de Atendimento & Checkout
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Volume de transações geradas por frente de caixa e canais digitais
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coloredChannels} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    width={180}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {coloredChannels.map((_: ColoredDistributionItem, index: number) => {
                      const barColor = DEFAULT_COLORS[(index + 3) % DEFAULT_COLORS.length] as string;
                      return <Cell key={`bar-${index}`} fill={barColor} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
