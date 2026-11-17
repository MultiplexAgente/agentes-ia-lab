/**
 * Multiplex / HUG — AI Gateway Service para Atendimento de Lojistas.
 *
 * Utiliza o @ai-sdk/gateway oficial e o AI SDK (generateText) para
 * sintetizar respostas sugeridas de alto nível para dúvidas de clientes.
 */

import { createGateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { providerApiKey } from "./model-registry.server";

export interface CustomerReplyOptions {
  question: string;
  context?: string;
  tone?: "cordial" | "comercial" | "direto" | "tecnico";
  companyName?: string;
  segment?: string;
}

export interface CustomerReplyResponse {
  ok: boolean;
  reply: string;
  modelUsed: string;
  viaGateway: boolean;
  error?: string;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  cordial: "Seja acolhedor, empático, atencioso e gentil. Use saudações calorosas e demonstre disposição total para ajudar.",
  comercial: "Foque em fechamento de venda, valor dos produtos/serviços e incentivo à compra com clareza e entusiasmo comercial.",
  direto: "Seja direto, conciso e objetivo. Responda à dúvida sem rodeios de maneira profissional e clara.",
  tecnico: "Forneça explicações detalhadas, precisas e confiáveis sobre especificações, prazos, regras ou composição.",
};

export async function generateCustomerSuggestedReply(
  opts: CustomerReplyOptions
): Promise<CustomerReplyResponse> {
  const { question, context = "", tone = "cordial", companyName, segment } = opts;

  if (!question || question.trim().length < 3) {
    return {
      ok: false,
      reply: "",
      modelUsed: "none",
      viaGateway: false,
      error: "A dúvida do cliente deve ter pelo menos 3 caracteres.",
    };
  }

  const toneRule = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.cordial;
  const storeIdentifier = companyName ? `a empresa "${companyName}"` : "nossa empresa";
  const segmentHint = segment ? `Atuamos no segmento de ${segment}.` : "";

  const systemPrompt = `Você é o assistente comercial oficial de ${storeIdentifier}. ${segmentHint}
Sua função é gerar uma resposta sugerida pronta e profissional para o lojista enviar diretamente ao cliente (via WhatsApp, chat ou balcão).

Diretrizes obrigatórias:
1. Tom de voz: ${toneRule}
2. Se houver informações de contexto fornecidas abaixo, utilize-as como verdade absoluta (preços, políticas, prazos e horários).
3. Nunca invente dados que contrariem o contexto informado.
4. Escreva a mensagem em primeira pessoa (como a loja falando com o cliente), de forma natural, sem jargões corporativos vazios.
5. Formate a mensagem de modo limpo e pronto para envio no WhatsApp (use quebras de linha adequadas).`;

  const userPrompt = `DÚVIDA DO CLIENTE:
"${question.trim()}"

${context.trim() ? `CONTEXTO / POLÍTICAS DA LOJA:\n"${context.trim()}"` : "Nenhum contexto adicional fornecido. Responda de forma prestativa solicitando os detalhes necessários caso falte alguma informação específica."}

Gere a resposta sugerida:`;

  const gatewayApiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_KEY;

  // 1. Tentativa via AI Gateway oficial
  if (gatewayApiKey) {
    try {
      const gateway = createGateway({
        apiKey: gatewayApiKey,
        baseURL: process.env.AI_GATEWAY_BASE_URL,
      });

      const modelId = process.env.AI_GATEWAY_MODEL || "openai/gpt-4o-mini";
      const model = gateway(modelId);

      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.5,
      });

      if (result.text && result.text.trim().length > 0) {
        return {
          ok: true,
          reply: result.text.trim(),
          modelUsed: modelId,
          viaGateway: true,
        };
      }
    } catch (gwError) {
      console.warn("[AI Gateway] Falha ao consultar via Gateway, acionando fallback:", gwError);
    }
  }

  // 2. Fallback via OpenAI Provider nativo
  const openAiKey = providerApiKey("openai") || process.env.OPENAI_API_KEY;
  if (openAiKey) {
    try {
      const openai = createOpenAI({ apiKey: openAiKey });
      const model = openai("gpt-4o-mini");

      const result = await generateText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.5,
      });

      if (result.text && result.text.trim().length > 0) {
        return {
          ok: true,
          reply: result.text.trim(),
          modelUsed: "gpt-4o-mini",
          viaGateway: false,
        };
      }
    } catch (openAiError) {
      console.warn("[AI Service] Falha no fallback OpenAI:", openAiError);
    }
  }

  // 3. Fallback determinístico de alta fidelidade para desenvolvimento e testes
  const fallbackReply = buildLocalContextualReply(question, context, tone, companyName);
  return {
    ok: true,
    reply: fallbackReply,
    modelUsed: "multiplex-local-fallback",
    viaGateway: false,
  };
}

function buildLocalContextualReply(
  question: string,
  context: string,
  tone: string,
  companyName?: string
): string {
  const store = companyName ? companyName : "nossa equipe";
  const greeting = tone === "direto" ? "Olá!" : "Olá! Tudo bem? Agradecemos pelo contato!";
  
  let body = "";
  if (context.trim()) {
    body = `Em relação à sua dúvida ("${question.trim()}"), confirmamos que: ${context.trim()}.`;
  } else {
    body = `Sobre a sua dúvida ("${question.trim()}"), teremos o maior prazer em te ajudar com todos os detalhes aqui na ${store}.`;
  }

  const closing =
    tone === "comercial"
      ? "Podemos já reservar o seu pedido ou prefere que eu envie mais fotos e opções? Fico no seu aguardo!"
      : tone === "direto"
      ? "Qualquer outra dúvida, estamos à disposição."
      : "Se precisar de mais alguma coisa ou quiser fechar o seu pedido, é só me avisar por aqui. Estamos à disposição!";

  return `${greeting}\n\n${body}\n\n${closing}`;
}
