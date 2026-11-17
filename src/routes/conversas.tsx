import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { useChatWorkspace } from "@/components/multiplex/ChatWorkspace";

export const Route = createFileRoute("/conversas")({
  head: () => ({
    meta: [
      { title: "Vendra AI | Assistente Inteligente Empresarial" },
      {
        name: "description",
        content: "Vendra AI - Assistente inteligente empresarial e atendimento comercial by BonaSoft (Motor Multiplex AI).",
      },
      { property: "og:title", content: "Vendra AI | Assistente Inteligente Empresarial by BonaSoft" },
      {
        property: "og:description",
        content: "Vendra AI - Assistente inteligente empresarial e atendimento comercial by BonaSoft (Motor Multiplex AI).",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ConversasPage,
});

function ConversasPage() {
  const { list, chat } = useChatWorkspace();
  return <AppShell secondary={list}>{chat}</AppShell>;
}
