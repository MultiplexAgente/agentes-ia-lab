import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame, StateBlock, useCompanyData } from "@/components/multiplex/DataPage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { money } from "@/lib/multiplex/client";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  total_orders: number | null;
  lifetime_value: number | string | null;
  created_at: string;
}

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | Multiplex" },
      { name: "description", content: "Clientes reais cadastrados na sua empresa." },
      { property: "og:title", content: "Clientes | Multiplex" },
      { property: "og:description", content: "Clientes reais cadastrados na sua empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data, error, loading } = useCompanyData<{ customers: Customer[] }>("/api/company/customers");
  const rows = data?.customers ?? [];

  return (
    <AppShell>
      <PageFrame title="Clientes" description={`${rows.length} registro(s)`}>
        <StateBlock
          loading={loading}
          error={error}
          empty={rows.length === 0}
          emptyText="Nenhum cliente cadastrado. Peça ao Multiplex no chat: “quero cadastrar um cliente”."
        >
          <div className="rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Total gasto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground">{row.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.email ?? "—"}</TableCell>
                    <TableCell className="text-right">{row.total_orders ?? 0}</TableCell>
                    <TableCell className="text-right">{money(row.lifetime_value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </StateBlock>
      </PageFrame>
    </AppShell>
  );
}
