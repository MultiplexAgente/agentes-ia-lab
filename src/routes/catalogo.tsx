import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame, StateBlock, useCompanyData } from "@/components/multiplex/DataPage";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/multiplex/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  available: boolean | null;
}

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo | Multiplex" },
      { name: "description", content: "Catálogo real de produtos da sua empresa no Multiplex." },
      { property: "og:title", content: "Catálogo | Multiplex" },
      { property: "og:description", content: "Catálogo real de produtos da sua empresa no Multiplex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { data, error, loading } = useCompanyData<{ products: Product[] }>("/api/company/workspace");
  const rows = data?.products ?? [];

  return (
    <AppShell>
      <PageFrame title="Catálogo" description={`${rows.length} produto(s)`}>
        <StateBlock
          loading={loading}
          error={error}
          empty={rows.length === 0}
          emptyText="Nenhum produto cadastrado. Cadastre em Configurações para o Multiplex responder com seus dados."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((product) => (
              <div key={product.id} className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{product.name}</p>
                  <Badge variant={product.available === false ? "secondary" : "default"}>
                    {product.available === false ? "Indisponível" : "Disponível"}
                  </Badge>
                </div>
                {product.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                )}
                <p className="mt-3 font-display text-lg font-semibold">{money(product.price)}</p>
              </div>
            ))}
          </div>
        </StateBlock>
      </PageFrame>
    </AppShell>
  );
}
