/**
 * Multiplex — adapters de provider.
 *
 * Todos os providers implementam a MESMA interface interna. O Agent Core
 * (pipeline.server.ts) nunca conhece detalhes de OpenAI, Anthropic ou DeepSeek.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import { providerApiKey, type ProviderId, type RegistryEntry } from "./model-registry.server";

/** Tool call normalizada — igual para os três providers. */
export interface NormalizedToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface NormalizedResponse {
  text: string;
  responseId: string | null;
  responseModel: string | null;
  finishReason: string | null;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  toolCalls: NormalizedToolCall[];
}

export interface ProviderCapabilities {
  provider: ProviderId;
  toolCalling: boolean;
  vision: boolean;
  reasoning: boolean;
  streaming: boolean;
}

export interface AIProviderAdapter {
  provider: ProviderId;
  /** Modelo pronto para o AI SDK (streamText/generateText). */
  model: (entry: RegistryEntry) => LanguageModel;
  /** Opções específicas do provider para uma chamada. */
  requestOptions: (entry: RegistryEntry, opts: { reasoning: boolean }) => Record<string, unknown>;
  /** Converte tool calls do provider para { id, name, arguments }. */
  normalizeToolCalls: (raw: unknown) => NormalizedToolCall[];
  getCapabilities: (entry: RegistryEntry) => ProviderCapabilities;
}

function normalizeSdkToolCalls(raw: unknown): NormalizedToolCall[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((call) => {
    const value = call as {
      toolCallId?: string; id?: string; toolName?: string; name?: string;
      input?: unknown; args?: unknown; arguments?: unknown;
    };
    const args = value.input ?? value.args ?? value.arguments ?? {};
    return {
      id: String(value.toolCallId ?? value.id ?? ""),
      name: String(value.toolName ?? value.name ?? ""),
      arguments: (typeof args === "object" && args !== null ? args : { value: args }) as Record<string, unknown>,
    };
  });
}

export class OpenAIProvider implements AIProviderAdapter {
  provider: ProviderId = "openai";
  constructor(private apiKey: string) {}
  model(entry: RegistryEntry): LanguageModel {
    // Modelos OpenAI de raciocínio usam a Responses API.
    return createOpenAI({ apiKey: this.apiKey }).responses(entry.modelId);
  }
  requestOptions(entry: RegistryEntry, opts: { reasoning: boolean }): Record<string, unknown> {
    return {
      openai: {
        store: false,
        ...(entry.reasoning && opts.reasoning
          ? {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            }
          : {}),
      },
    };
  }
  normalizeToolCalls = normalizeSdkToolCalls;
  getCapabilities(entry: RegistryEntry): ProviderCapabilities {
    return { provider: "openai", toolCalling: entry.toolCalling, vision: entry.vision, reasoning: entry.reasoning, streaming: entry.streaming };
  }
}

export class AnthropicProvider implements AIProviderAdapter {
  provider: ProviderId = "anthropic";
  constructor(private apiKey: string) {}
  model(entry: RegistryEntry): LanguageModel {
    return createAnthropic({ apiKey: this.apiKey })(entry.modelId);
  }
  requestOptions(): Record<string, unknown> {
    return {};
  }
  normalizeToolCalls = normalizeSdkToolCalls;
  getCapabilities(entry: RegistryEntry): ProviderCapabilities {
    return { provider: "anthropic", toolCalling: entry.toolCalling, vision: entry.vision, reasoning: entry.reasoning, streaming: entry.streaming };
  }
}

export class DeepSeekProvider implements AIProviderAdapter {
  provider: ProviderId = "deepseek";
  constructor(private apiKey: string) {}
  model(entry: RegistryEntry): LanguageModel {
    return createDeepSeek({ apiKey: this.apiKey, baseURL: "https://api.deepseek.com/v1" })(entry.modelId);
  }
  requestOptions(): Record<string, unknown> {
    return {};
  }
  normalizeToolCalls = normalizeSdkToolCalls;
  getCapabilities(entry: RegistryEntry): ProviderCapabilities {
    return { provider: "deepseek", toolCalling: entry.toolCalling, vision: entry.vision, reasoning: entry.reasoning, streaming: entry.streaming };
  }
}

/** Cria o adapter do provider lendo a credencial apenas no servidor. */
export function createProviderAdapter(provider: ProviderId): AIProviderAdapter | { error: string } {
  const apiKey = providerApiKey(provider);
  if (!apiKey) return { error: `Credencial do provider ${provider} ausente no servidor.` };
  switch (provider) {
    case "openai":
      return new OpenAIProvider(apiKey);
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "deepseek":
      return new DeepSeekProvider(apiKey);
  }
}

export function isAdapterError(value: AIProviderAdapter | { error: string }): value is { error: string } {
  return "error" in value;
}
