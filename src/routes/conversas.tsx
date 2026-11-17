import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/multiplex/AppShell";
import { useChatWorkspace } from "@/components/multiplex/ChatWorkspace";

export const Route = createFileRoute("/conversas")({
  head: () => ({
    meta: [
      { title: "Atendimento & IA Multiplex | BonaSoft Commerce" },
      {
        name: "description",
        content: "Central de atendimento inteligente e motor de IA Multiplex do BonaSoft Commerce.",
      },
      { property: "og:title", content: "Atendimento & IA Multiplex | BonaSoft Commerce" },
      {
        property: "og:description",
        content: "Central de atendimento inteligente e motor de IA Multiplex do BonaSoft Commerce.",
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
