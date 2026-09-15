import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getOptionalCompanySession } from "@/lib/multiplex/company-auth.server";
import { ensureWebConversation, loadPersistedHistory, persistMessage } from "@/lib/multiplex/conversation.server";
import { runMultiplexTurn } from "@/lib/multiplex/pipeline.server";
import { getServiceClient, resolvePublicCompany } from "@/lib/multiplex/supabase.server";

const BodySchema = z.object({
  message: z.string().min(1).max(8000),
  conversationId: z.string().uuid().nullable().optional(),
  publicSessionId: z.string().uuid().optional(),
  channel: z.enum(["web"]).default("web"),
  context: z.record(z.unknown()).optional(),
});

export const Route = createFileRoute("/api/ai/conversation/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Mensagem ou sessão inválida." }, { status: 400 });

        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await getOptionalCompanySession(supabase, request);
        const company = session
          ? { id: session.companyId, name: session.companyName }
          : await resolvePublicCompany(supabase);
        if (!company) return Response.json({ error: "Empresa do chat público não configurada." }, { status: 503 });
        if (!session && !parsed.data.publicSessionId) {
          return Response.json({ error: "Sessão pública inválida." }, { status: 400 });
        }

        const actor = session
          ? { kind: "authenticated" as const, userId: session.userId, email: session.email }
          : { kind: "public" as const, publicSessionId: parsed.data.publicSessionId };
        const conversation = await ensureWebConversation(supabase, {
          companyId: company.id,
          requestedConversationId: parsed.data.conversationId,
          actor,
        });
        if (!conversation) return Response.json({ error: "Não foi possível abrir a conversa." }, { status: 500 });

        const history = await loadPersistedHistory(supabase, company.id, conversation.id, 12);
        const incoming = await persistMessage(supabase, {
          companyId: company.id,
          conversationId: conversation.id,
          senderType: "customer",
          text: parsed.data.message,
          metadata: { actor: actor.kind },
          status: "received",
        });
        if (!incoming) return Response.json({ error: "Não foi possível registrar sua mensagem." }, { status: 500 });

        const result = await runMultiplexTurn({
          supabase,
          company,
          message: parsed.data.message,
          history,
          channel: "web",
          conversationId: conversation.id,
          messageId: incoming.id,
          agentId: conversation.agentId,
          requestContext: parsed.data.context,
        });
        if (!result.ok) {
          return Response.json({ error: result.error, conversation: { id: conversation.id } }, { status: result.status });
        }

        const assistant = await persistMessage(supabase, {
          companyId: company.id,
          conversationId: conversation.id,
          senderType: "agent",
          text: result.text,
          metadata: {
            response_id: result.trace.responseId,
            response_model: result.trace.responseModel,
            finish_reason: result.trace.finishReason,
          },
        });
        if (!assistant) return Response.json({ error: "A resposta real foi recebida, mas não pôde ser registrada." }, { status: 500 });

        return Response.json({
          conversation: { id: conversation.id, company_id: company.id },
          assistantMessage: { id: assistant.id, role: "assistant", content: result.text },
          routing: {
            task: result.routing.category,
            taskLabel: result.routing.categoryLabel,
            complexity: result.routing.complexity,
            strategy: result.routing.strategy,
            reason: result.routing.publicReason,
          },
          usage: result.usage,
          context: result.context,
          auditPersisted: result.auditPersisted,
        });
      },
    },
  },
});