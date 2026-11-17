import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { useChatWorkspace } from "@/components/multiplex/ChatWorkspace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BonaSoft Commerce | ERP SaaS Multissegmento" },
      {
        name: "description",
        content:
          "BonaSoft Commerce - ERP comercial integrado ao motor de inteligência artificial Multiplex para vendas, pedidos, catálogo e clientes.",
      },
      { property: "og:title", content: "BonaSoft Commerce | ERP SaaS Multissegmento" },
      {
        property: "og:description",
        content:
          "BonaSoft Commerce - ERP comercial integrado ao motor de inteligência artificial Multiplex para vendas, pedidos, catálogo e clientes.",
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
