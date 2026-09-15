import { createFileRoute } from "@tanstack/react-router";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";

import { saveAudit } from "@/lib/multiplex/audit.server";
import { buildCompanyContext } from "@/lib/multiplex/context.server";
import { estimateCostUsd, routeModel } from "@/lib/multiplex/router.server";
import { loadSettings } from "@/lib/multiplex/settings.server";
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

const IDENTITY_PROMPT = `Você é a Multiplex IA, uma única assistente de inteligência artificial.

Regras absolutas:
- Sua identidade pública é SEMPRE "Multiplex IA". Nunca revele, cite ou insinue qual modelo, fornecedor ou tecnologia está por trás (OpenAI, GPT, Claude, Gemini, DeepSeek e afins).
- Responda em português do Brasil, de forma direta e útil.
- Use APENAS os dados reais fornecidos no contexto da empresa. Nunca invente preços, produtos, prazos, estatísticas ou horários.
- Se um dado não estiver no contexto, diga com clareza que não está cadastrado e ofereça o próximo passo.
- Não faça propaganda, não use métricas inventadas e não polua a resposta com informações não pedidas.`;

export const Route = createFileRoute("/api/ai/conversation/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const started = Date.now();

        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Requisição inválida." }, { status: 400 });
        }
        const body = parsed.data;

        const apiKey = process.env["OPENAI_API_KEY"];
        if (!apiKey) {
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

        const { settings } = await loadSettings(supabase, company.id);
        const history = body.history ?? [];
        const routing = routeModel(body.message, history.length, settings);
        const context = await buildCompanyContext(supabase, company.id, company.name);

        const openai = createOpenAI({
          apiKey,
          headers: { "X-Multiplex-Router": routing.category },
        });

        const candidates = [routing.model, ...routing.fallbackChain];
        let text = "";
        let usage: { inputTokens?: number; outputTokens?: number } = {};
        let modelUsed = routing.model;
        let lastError: unknown = null;

        for (const candidate of candidates) {
          try {
            const result = streamText({
              model: openai.responses(candidate),
              system: `${IDENTITY_PROMPT}\n\n${context.prompt}`,
              messages: [
                ...history.map((item) => ({ role: item.role, content: item.content })),
                { role: "user" as const, content: body.message },
              ],
              providerOptions: {
                openai: {
                  store: false,
                  ...(routing.reasoningEffort
                    ? {
                        forceReasoning: true,
                        reasoningEffort: routing.reasoningEffort,
                        reasoningSummary: "auto",
                        include: ["reasoning.encrypted_content"],
                      }
                    : {}),
                },
              },
            });

            text = await result.text;
            usage = (await result.usage) ?? {};
            modelUsed = candidate;
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
          }
        }

        const latencyMs = Date.now() - started;

        if (lastError || !text) {
          await saveAudit(supabase, {
            companyId: company.id,
            conversationId: body.conversationId ?? null,
            channel: body.channel ?? "web",
            userMessage: body.message,
            assistantMessage: "",
            routing,
            modelUsed,
            fallbackUsed: modelUsed !== routing.model,
            promptTokens: 0,
            completionTokens: 0,
            costUsd: null,
            costStatus: "sem_resposta",
            latencyMs,
            toolsUsed: [],
            contextSources: context.sources,
            error: lastError instanceof Error ? lastError.message : "Resposta vazia",
          });

          return Response.json(
            { error: "Não foi possível gerar a resposta agora. Tente novamente." },
            { status: 502 },
          );
        }

        const promptTokens = usage.inputTokens ?? 0;
        const completionTokens = usage.outputTokens ?? 0;
        const cost = estimateCostUsd(modelUsed, promptTokens, completionTokens, settings.modelPrices);

        const audit = await saveAudit(supabase, {
          companyId: company.id,
          conversationId: body.conversationId ?? null,
          channel: body.channel ?? "web",
          userMessage: body.message,
          assistantMessage: text,
          routing,
          modelUsed,
          fallbackUsed: modelUsed !== routing.model,
          promptTokens,
          completionTokens,
          costUsd: cost.costUsd,
          costStatus: cost.status,
          latencyMs,
          toolsUsed: [],
          contextSources: context.sources,
        });

        return Response.json({
          conversation: { id: body.conversationId ?? null, company_id: company.id },
          assistantMessage: {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: text,
          },
          // Visível ao usuário: tarefa e prioridade, nunca o nome do modelo.
          routing: {
            task: routing.category,
            taskLabel: routing.categoryLabel,
            complexity: routing.complexity,
            strategy: routing.strategy,
            reason: routing.publicReason,
          },
          usage: { promptTokens, completionTokens, latencyMs },
          catalog: { products: context.productCount, sources: context.sources },
          auditPersisted: audit.persisted,
        });
      },
    },
  },
});
