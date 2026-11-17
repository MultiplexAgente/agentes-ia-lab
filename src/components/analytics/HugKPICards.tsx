import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface HugKPICardData {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive?: boolean;
    label?: string;
  };
  badge?: string;
  format?: "currency" | "number" | "percent";
}

interface HugKPICardsProps {
  cards: HugKPICardData[];
  isLoading?: boolean;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export const formatKPIValue = (value: string | number, format?: HugKPICardData["format"]): string => {
  if (typeof value === "string") return value;
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value);
    case "percent":
      return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    case "number":
    default:
      return value.toLocaleString("pt-BR");
  }
};

export function HugKPICards({
  cards,
  isLoading = false,
  columns = 4,
  className,
}: HugKPICardsProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  };

  if (isLoading) {
    return (
      <div className={cn(`grid ${gridCols[columns]} gap-4`, className)}>
        {Array.from({ length: columns }).map((_, i) => (
          <Card key={i} className="border-border/60 bg-card/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28 mb-2" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(`grid ${gridCols[columns]} gap-4`, className)}>
      {cards.map((c, i) => {
        const Icon = c.icon;
        const isUp = c.trend ? (c.trend.isPositive ?? c.trend.value >= 0) : null;

        return (
          <Card
            key={i}
            className="group relative overflow-hidden border-border/60 bg-card/70 backdrop-blur-sm shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {c.title}
              </span>
              {Icon && (
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-4" />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {formatKPIValue(c.value, c.format)}
                </div>
                {c.badge && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {c.badge}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {c.trend && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-semibold text-xs",
                      isUp ? "text-emerald-500" : "text-rose-500",
                    )}
                  >
                    {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {c.trend.value > 0 ? `+${c.trend.value}%` : `${c.trend.value}%`}
                  </span>
                )}
                {c.subtitle && <span className="truncate">{c.subtitle}</span>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
