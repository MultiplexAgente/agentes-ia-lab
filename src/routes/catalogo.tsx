import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Tag, Barcode, Boxes } from "lucide-react";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame, StateBlock, useCompanyData } from "@/components/multiplex/DataPage";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/multiplex/client";
import { getSegmentConfig, type CommerceSegment } from "@/lib/commerce/segments";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  available: boolean | null;
  segment?: CommerceSegment | null;
  barcode_ean?: string | null;
  sku?: string | null;
  unit_of_measure?: string | null;
  current_stock?: number | null;
  segment_attributes?: Record<string, unknown> | null;
}

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo de Produtos | VENDRA ERP" },
      { name: "description", content: "Catálogo multissegmento de produtos e serviços no VENDRA by BonaSoft." },
      { property: "og:title", content: "Catálogo de Produtos | VENDRA ERP" },
      { property: "og:description", content: "Catálogo multissegmento de produtos e serviços no VENDRA by BonaSoft." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { data, error, loading } = useCompanyData<{ products: Product[] }>("/api/company/workspace");
  const rows = data?.products ?? [];

  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Segmentos presentes no catálogo da empresa
  const presentSegments = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((p) => {
      if (p.segment) set.add(p.segment);
    });
    return Array.from(set);
  }, [rows]);

  // Filtra por segmento e por texto (nome, descrição ou código de barras)
  const filteredRows = useMemo(() => {
    return rows.filter((product) => {
      if (selectedSegment !== "all" && product.segment !== selectedSegment) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchName = product.name.toLowerCase().includes(q);
      const matchDesc = (product.description ?? "").toLowerCase().includes(q);
      const matchBarcode = (product.barcode_ean ?? "").toLowerCase().includes(q);
      const matchSku = (product.sku ?? "").toLowerCase().includes(q);

      return matchName || matchDesc || matchBarcode || matchSku;
    });
  }, [rows, selectedSegment, searchQuery]);

  return (
    <AppShell>
      <PageFrame title="Catálogo Universal" description={`${filteredRows.length} produto(s) exibido(s)`}>
        {/* BARRA DE FILTROS E BUSCA POR CÓDIGO DE BARRAS / NOME */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* BUSCA */}
            <div className="relative min-w-72 flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, código EAN ou SKU..."
                className="w-full rounded-xl border border-border/70 bg-card/60 pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* TOTALIZADOR */}
            <div className="text-xs text-muted-foreground font-medium">
              Total no catálogo: <span className="font-semibold text-foreground">{rows.length}</span>
            </div>
          </div>

          {/* ABAS / PILLS DE SEGMENTOS PRESENTES */}
          {presentSegments.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground mr-1 uppercase">Segmentos:</span>
              <button
                type="button"
                onClick={() => setSelectedSegment("all")}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                  selectedSegment === "all"
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({rows.length})
              </button>
              {presentSegments.map((segKey) => {
                const cfg = getSegmentConfig(segKey);
                const count = rows.filter((p) => p.segment === segKey).length;
                return (
                  <button
                    key={segKey}
                    type="button"
                    onClick={() => setSelectedSegment(segKey)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer ${
                      selectedSegment === segKey
                        ? "border-primary bg-primary text-primary-foreground font-semibold"
                        : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cfg.shortLabel} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <StateBlock
          loading={loading}
          error={error}
          empty={filteredRows.length === 0}
          emptyText={
            rows.length === 0
              ? "Nenhum produto cadastrado. Cadastre em Configurações para disponibilizar no catálogo e nas operações com IA."
              : "Nenhum produto encontrado com os filtros aplicados."
          }
        >
          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredRows.map((product) => {
              const seg = product.segment || "food_service";
              const segCfg = getSegmentConfig(seg);
              const attrs = (product.segment_attributes as any) || {};

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between rounded-xl border border-border/70 bg-card/40 p-4 shadow-sm hover:border-border transition-all"
                >
                  <div>
                    {/* CABEÇALHO DO CARD COM BADGE DO SEGMENTO */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                          {segCfg.shortLabel}
                        </Badge>
                        {product.unit_of_measure && (
                          <span className="text-[11px] font-mono text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">
                            {product.unit_of_measure}
                          </span>
                        )}
                      </div>
                      <Badge variant={product.available === false ? "secondary" : "default"} className="text-[10px]">
                        {product.available === false ? "Indisponível" : "Disponível"}
                      </Badge>
                    </div>

                    {/* NOME E DESCRIÇÃO */}
                    <p className="font-semibold text-sm text-foreground leading-snug">{product.name}</p>
                    {product.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    {/* DETALHES VERTICAIS DO SEGMENTO */}
                    <div className="mt-2.5 space-y-1 text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                      {/* Código de barras / EAN */}
                      {product.barcode_ean && (
                        <div className="flex items-center gap-1 font-mono">
                          <Barcode className="size-3 text-muted-foreground" />
                          <span>EAN: {product.barcode_ean}</span>
                        </div>
                      )}

                      {/* Farmácia */}
                      {seg === "pharmacy" && attrs.active_ingredient && (
                        <p className="line-clamp-1">
                          <strong className="text-foreground">Princípio:</strong> {attrs.active_ingredient}{" "}
                          {attrs.dosage ? `(${attrs.dosage})` : ""}
                        </p>
                      )}
                      {seg === "pharmacy" && attrs.requires_prescription && (
                        <span className="inline-block text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                          Retenção de Receita
                        </span>
                      )}

                      {/* Moda */}
                      {seg === "fashion" && (attrs.size || attrs.color) && (
                        <p>
                          {attrs.size ? `Tam: ${attrs.size} ` : ""}
                          {attrs.color ? `· Cor: ${attrs.color}` : ""}
                        </p>
                      )}

                      {/* Gastronomia */}
                      {seg === "food_service" && attrs.preparation_time_minutes && (
                        <p>Preparo médio: {attrs.preparation_time_minutes} min</p>
                      )}

                      {/* Estoque */}
                      {product.current_stock !== null && product.current_stock !== undefined && (
                        <p className="font-medium text-foreground/80">
                          Estoque: {product.current_stock} {product.unit_of_measure || "UN"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* PREÇO DE VENDA */}
                  <div className="mt-4 pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground font-medium">Preço</span>
                    <span className="font-display text-lg font-bold text-foreground">{money(product.price)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </StateBlock>
      </PageFrame>
    </AppShell>
  );
}
