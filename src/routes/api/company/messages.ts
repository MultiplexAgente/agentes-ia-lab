import { createFileRoute } from "@tanstack/react-router";

import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient, isUuid } from "@/lib/multiplex/supabase.server";

export const Route = createFileRoute("/api/company/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });

        const conversationId = new URL(request.url).searchParams.get("conversationId");
        if (!isUuid(conversationId)) return Response.json({ error: "Conversa inválida." }, { status: 400 });

        const { data: conversation } = await supabase
          .from("conversations")
          .select("id, metadata")
          .eq("company_id", session.companyId)
          .eq("id", conversationId)
          .maybeSingle();
        if (!conversation) return Response.json({ error: "Conversa não encontrada." }, { status: 404 });

        const metadata = ((conversation as { metadata: Record<string, unknown> | null }).metadata ?? {}) as Record<string, unknown>;
        if (metadata["actor"] === "authenticated" && metadata["user_id"] !== session.userId) {
          return Response.json({ error: "Você não tem acesso a esta conversa." }, { status: 403 });
        }

        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_type, text, created_at, metadata")
          .eq("company_id", session.companyId)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(300);
        if (error) return Response.json({ error: "Não foi possível carregar as mensagens." }, { status: 500 });

        return Response.json({
          messages: ((data ?? []) as Array<{ id: string; sender_type: string; text: string | null; created_at: string }>).map(
            (row) => ({
              id: row.id,
              role: row.sender_type === "customer" ? "user" : "assistant",
              content: row.text ?? "",
              createdAt: row.created_at,
            }),
          ),
        });
      },
    },
  },
});
