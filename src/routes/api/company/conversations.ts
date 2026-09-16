import { createFileRoute } from "@tanstack/react-router";

import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient, isUuid } from "@/lib/multiplex/supabase.server";

interface ConversationRow {
  id: string;
  status: string | null;
  channel_type: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string | null;
  agent_id: string | null;
  metadata: Record<string, unknown> | null;
}

function title(row: ConversationRow): string {
  const stored = row.metadata?.["title"];
  if (typeof stored === "string" && stored.trim()) return stored.trim();
  return "Novo chat";
}

export const Route = createFileRoute("/api/company/conversations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });

        const { data, error } = await supabase
          .from("conversations")
          .select("id, status, channel_type, last_message_text, last_message_at, created_at, updated_at, agent_id, metadata")
          .eq("company_id", session.companyId)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) return Response.json({ error: "Não foi possível carregar as conversas." }, { status: 500 });

        const rows = (data ?? []) as ConversationRow[];
        return Response.json({
          conversations: rows
            .filter((row) => {
              const actor = row.metadata?.["actor"];
              const userId = row.metadata?.["user_id"];
              // conversas do próprio usuário + conversas de canal (WhatsApp) da empresa
              return actor !== "authenticated" || userId === session.userId;
            })
            .map((row) => ({
              id: row.id,
              title: title(row),
              preview: row.last_message_text ?? "",
              channel: row.channel_type ?? "web",
              status: row.status ?? "ACTIVE",
              lastMessageAt: row.last_message_at ?? row.created_at,
              createdAt: row.created_at,
            })),
        });
      },

      POST: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });

        const { data: agent } = await supabase
          .from("agents")
          .select("id")
          .eq("company_id", session.companyId)
          .eq("active", true)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("company_id", session.companyId)
          .eq("email", session.email)
          .limit(1)
          .maybeSingle();

        let customerId = (existingCustomer as { id?: string } | null)?.id ?? null;
        if (!customerId) {
          const { data: created } = await supabase
            .from("customers")
            .insert({ company_id: session.companyId, name: session.email, email: session.email })
            .select("id")
            .maybeSingle();
          customerId = (created as { id?: string } | null)?.id ?? null;
        }
        if (!customerId) return Response.json({ error: "Não foi possível abrir a conversa." }, { status: 500 });

        const { data, error } = await supabase
          .from("conversations")
          .insert({
            company_id: session.companyId,
            customer_id: customerId,
            agent_id: (agent as { id?: string } | null)?.id ?? null,
            channel_type: "web",
            status: "ACTIVE",
            metadata: { actor: "authenticated", user_id: session.userId, title: "Novo chat" },
          })
          .select("id, created_at, agent_id")
          .maybeSingle();
        if (error || !data) return Response.json({ error: "Não foi possível abrir a conversa." }, { status: 500 });

        const row = data as { id: string; created_at: string; agent_id: string | null };
        return Response.json({
          conversation: {
            id: row.id,
            title: "Novo chat",
            preview: "",
            channel: "web",
            status: "ACTIVE",
            lastMessageAt: row.created_at,
            createdAt: row.created_at,
            companyId: session.companyId,
            userId: session.userId,
            agentId: row.agent_id,
          },
        });
      },

      DELETE: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) return Response.json({ error: session.error }, { status: session.status });

        const id = new URL(request.url).searchParams.get("id");
        if (!isUuid(id)) return Response.json({ error: "Conversa inválida." }, { status: 400 });

        const { data: found } = await supabase
          .from("conversations")
          .select("id, metadata")
          .eq("company_id", session.companyId)
          .eq("id", id)
          .maybeSingle();
        if (!found) return Response.json({ error: "Conversa não encontrada." }, { status: 404 });

        const metadata = ((found as { metadata: Record<string, unknown> | null }).metadata ?? {}) as Record<string, unknown>;
        if (metadata["actor"] === "authenticated" && metadata["user_id"] !== session.userId) {
          return Response.json({ error: "Você não tem acesso a esta conversa." }, { status: 403 });
        }

        await supabase.from("messages").delete().eq("company_id", session.companyId).eq("conversation_id", id);
        const { error } = await supabase
          .from("conversations")
          .delete()
          .eq("company_id", session.companyId)
          .eq("id", id);
        if (error) return Response.json({ error: "Não foi possível excluir a conversa." }, { status: 500 });
        return Response.json({ deleted: true });
      },
    },
  },
});
