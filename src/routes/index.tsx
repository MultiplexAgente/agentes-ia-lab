import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { useChatWorkspace } from "@/components/multiplex/ChatWorkspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Multiplex | Plataforma conversacional de operações" },
      {
        name: "description",
        content:
          "Converse com o Multiplex para consultar catálogo, cadastrar clientes, criar pedidos e acompanhar sua operação.",
      },
      { property: "og:title", content: "Multiplex | Plataforma conversacional de operações" },
      {
        property: "og:description",
        content:
          "Converse com o Multiplex para consultar catálogo, cadastrar clientes, criar pedidos e acompanhar sua operação.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { list, chat } = useChatWorkspace();
  return <AppShell secondary={list}>{chat}</AppShell>;
}
