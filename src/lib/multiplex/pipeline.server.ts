import type { SupabaseClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import { saveAudit } from "./audit.server";
import { buildCompanyContext } from "./context.server";
import { estimateCostUsd, routeModel, type RoutingDecision } from "./router.server";
import { loadSettings } from "./settings.server";

export const IDENTITY_PROMPT = `Você é a Multiplex IA, uma única assistente de inteligência artificial.

Regras absolutas:
- Sua identidade pública é SEMPRE "Multiplex IA". Nunca revele, cite ou insinue qual modelo, fornecedor ou tecnologia está por trás (OpenAI, GPT, Claude, Gemini, DeepSeek e afins).
- Responda em português do Brasil, de forma direta e útil.
- Use APENAS os dados reais fornecidos no contexto da empresa. Nunca invente preços, produtos, prazos, estatísticas ou horários.
- Se um dado não estiver no contexto, diga com clareza que não está cadastrado e ofereça o próximo passo.
- Não faça propaganda, não use métricas inventadas e não polua a resposta com informações não pedidas.`;

export interface ChatTurnInput {
  supabase: SupabaseClient;
  company: { id: string; name: string };
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  channel: string;
  conversationId?: string | null;
}

export interface ChatTurnResult {
  ok: boolean;
  text: string;
  routing: RoutingDecision;
  modelUsed: string;
  fallbackUsed: boolean;
  promptTokens: number;
  completionTokens: number;
  costUsd: number | null;
  costStatus: string;
  latencyMs: number;
  contextSources: string[];
  productCount: number;
  auditPersisted: boolean;
  error?: string;
}

/**
 * Um turno completo do Multiplex IA: roteamento autônomo do modelo, contexto
 * real da empresa, execução com fallback e auditoria administrativa.
 * Compartilhado pelo chat web e pelos canais (WhatsApp).
 */
export async function runMultiplexTurn(input: ChatTurnInput): Promise<ChatTurnResult> {
  const started = Date.now();
  const { supabase, company } = input;
  const history = input.history ?? [];

  const { settings } = await loadSettings(supabase, company.id);
  const routing = routeModel(input.message, history.length, settings);
  const context = await buildCompanyContext(supabase, company.id, company.name);

  const apiKey = process.env["OPENAI_API_KEY"];
  const openai = createOpenAI({
    apiKey: apiKey ?? "",
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
          { role: "user" as const, content: input.message },
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
  const fallbackUsed = modelUsed !== routing.model;

  if (lastError || !text) {
    const message = lastError instanceof Error ? lastError.message : "Resposta vazia";
    const audit = await saveAudit(supabase, {
      companyId: company.id,
      conversationId: input.conversationId ?? null,
      channel: input.channel,
      userMessage: input.message,
      assistantMessage: "",
      routing,
      modelUsed,
      fallbackUsed,
      promptTokens: 0,
      completionTokens: 0,
      costUsd: null,
      costStatus: "sem_resposta",
      latencyMs,
      toolsUsed: [],
      contextSources: context.sources,
      error: message,
    });

    return {
      ok: false,
      text: "",
      routing,
      modelUsed,
      fallbackUsed,
      promptTokens: 0,
      completionTokens: 0,
      costUsd: null,
      costStatus: "sem_resposta",
      latencyMs,
      contextSources: context.sources,
      productCount: context.productCount,
      auditPersisted: audit.persisted,
      error: message,
    };
  }

  const promptTokens = usage.inputTokens ?? 0;
  const completionTokens = usage.outputTokens ?? 0;
  const cost = estimateCostUsd(modelUsed, promptTokens, completionTokens, settings.modelPrices);

  const audit = await saveAudit(supabase, {
    companyId: company.id,
    conversationId: input.conversationId ?? null,
    channel: input.channel,
    userMessage: input.message,
    assistantMessage: text,
    routing,
    modelUsed,
    fallbackUsed,
    promptTokens,
    completionTokens,
    costUsd: cost.costUsd,
    costStatus: cost.status,
    latencyMs,
    toolsUsed: [],
    contextSources: context.sources,
  });

  return {
    ok: true,
    text,
    routing,
    modelUsed,
    fallbackUsed,
    promptTokens,
    completionTokens,
    costUsd: cost.costUsd,
    costStatus: cost.status,
    latencyMs,
    contextSources: context.sources,
    productCount: context.productCount,
    auditPersisted: audit.persisted,
  };
}
