import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame, StateBlock, useCompanyData } from "@/components/multiplex/DataPage";
import { Badge } from "@/components/ui/badge";

interface Overview {
  channels: Array<{ id: string; type: string | null; name: string | null; status: string | null; active: boolean | null }>;
  channelsError: string | null;
}

export const Route = createFileRoute("/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações | Multiplex" },
      { name: "description", content: "Canais conectados à sua operação no Multiplex." },
      { property: "og:title", content: "Integrações | Multiplex" },
      { property: "og:description", content: "Canais conectados à sua operação no Multiplex." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { data, error, loading } = useCompanyData<Overview>("/api/company/overview");
  const rows = data?.channels ?? [];

  return (
    <AppShell>
      <PageFrame title="Integrações" description="Canais de atendimento conectados">
        <StateBlock
          loading={loading}
          error={error ?? data?.channelsError ?? null}
          empty={rows.length === 0}
          emptyText="Nenhum canal conectado. O chat web já está ativo; o WhatsApp aparece aqui depois de configurado."
        >
          <div className="space-y-3">
            {rows.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/40 p-4"
              >
                <div>
                  <p className="font-medium">{channel.name ?? channel.type ?? "Canal"}</p>
                  <p className="text-xs text-muted-foreground">{channel.type ?? "—"}</p>
                </div>
                <Badge variant={channel.active ? "default" : "secondary"}>
                  {channel.status ?? (channel.active ? "ativo" : "inativo")}
                </Badge>
              </div>
            ))}
          </div>
        </StateBlock>
      </PageFrame>
    </AppShell>
  );
}
