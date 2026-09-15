import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { runMultiplexTurn } from "@/lib/multiplex/pipeline.server";
import { getServiceClient, resolveCompanyId } from "@/lib/multiplex/supabase.server";

const BodySchema = z.object({
  message: z.string().min(1).max(8000),
  companyId: z.string().max(64).optional(),
  conversationId: z.string().max(64).optional(),
  channel: z.string().max(32).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .max(24)
    .optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const Route = createFileRoute("/api/ai/conversation/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Requisição inválida." }, { status: 400 });
        }
        const body = parsed.data;

        if (!process.env["OPENAI_API_KEY"]) {
          return Response.json(
            { error: "A chave de IA não está configurada no servidor." },
            { status: 503 },
          );
        }

        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json(
            { error: "A conexão com o banco de dados não está configurada." },
            { status: 503 },
          );
        }

        const company = await resolveCompanyId(supabase, body.companyId);
        if (!company) {
          return Response.json({ error: "Nenhuma empresa ativa encontrada." }, { status: 400 });
        }

        const turn = await runMultiplexTurn({
          supabase,
          company,
          message: body.message,
          history: body.history ?? [],
          channel: body.channel ?? "web",
          conversationId: body.conversationId ?? null,
        });

        if (!turn.ok) {
          return Response.json(
            { error: "Não foi possível gerar a resposta agora. Tente novamente." },
            { status: 502 },
          );
        }

        return Response.json({
          conversation: { id: body.conversationId ?? null, company_id: company.id },
          assistantMessage: {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: turn.text,
          },
          // Visível ao usuário: tarefa e prioridade, nunca o nome do modelo.
          routing: {
            task: turn.routing.category,
            taskLabel: turn.routing.categoryLabel,
            complexity: turn.routing.complexity,
            strategy: turn.routing.strategy,
            reason: turn.routing.publicReason,
          },
          usage: {
            promptTokens: turn.promptTokens,
            completionTokens: turn.completionTokens,
            latencyMs: turn.latencyMs,
          },
          catalog: { products: turn.productCount, sources: turn.contextSources },
          auditPersisted: turn.auditPersisted,
        });
      },
    },
  },
});
