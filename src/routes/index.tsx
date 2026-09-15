import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy } from "react";

const App = lazy(() => import("@/app/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Multiplex IA | Assistente inteligente" },
      {
        name: "description",
        content:
          "Converse com a Multiplex IA para obter informações e realizar tarefas.",
      },
      { property: "og:title", content: "Multiplex IA | Assistente inteligente" },
      {
        property: "og:description",
        content:
          "Converse com a Multiplex IA para obter informações e realizar tarefas.",
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
