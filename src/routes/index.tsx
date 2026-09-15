import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy } from "react";

const App = lazy(() => import("@/app/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Multiplex IA | Agentes de IA para WhatsApp e Instagram" },
      {
        name: "description",
        content:
          "Plataforma de agentes de IA omnichannel: atendimento e vendas no WhatsApp, Instagram, Telegram e site, com catálogo, memória e painel executivo.",
      },
      { property: "og:title", content: "Multiplex IA | Agentes de IA Omnichannel" },
      {
        property: "og:description",
        content:
          "Crie, treine e publique agentes de IA para atendimento e vendas em WhatsApp, Instagram e Telegram.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={<div className="min-h-screen" />}>
      <App />
    </ClientOnly>
  );
}
