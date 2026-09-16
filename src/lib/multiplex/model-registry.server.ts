/**
 * Multiplex — Model Registry + ProviderCapabilityService.
 *
 * O frontend envia apenas o alias público (gpt | claude | deepseek).
 * Os model IDs reais existem SOMENTE aqui e nunca são escolhidos pelo cliente.
 */

export const MODEL_ALIASES = ["gpt", "claude", "deepseek"] as const;
export type ModelAlias = (typeof MODEL_ALIASES)[number];

export const ALIAS_LABELS: Record<ModelAlias, string> = {
  gpt: "GPT",
  claude: "CLAUDE",
  deepseek: "DEEPSEEK",
};

export type ProviderId = "openai" | "anthropic" | "deepseek";
export type ModelStatus = "active" | "deprecated" | "retired" | "disabled" | "unavailable";
export type LatencyClass = "fast" | "standard" | "slow";
export type ModelTierName = "flagship" | "balanced" | "fast" | "light";

export interface RegistryEntry {
  alias: ModelAlias;
  provider: ProviderId;
  modelId: string;
  tier: ModelTierName;
  status: ModelStatus;
  capabilities: string[];
  contextWindow: number;
  toolCalling: boolean;
  vision: boolean;
  reasoning: boolean;
  streaming: boolean;
  latencyClass: LatencyClass;
  /** Modelo destinado apenas a processamento auxiliar (nunca conversa). */
  auxiliaryOnly?: boolean;
}

/**
 * Ordem = prioridade de tier. O primeiro entry ativo e disponível na conta é o
 * flagship do alias; entries `auxiliaryOnly` nunca respondem ao usuário.
 */
export const MODEL_REGISTRY: RegistryEntry[] = [
  // ---------- OPENAI (alias público: gpt) ----------
  {
    alias: "gpt", provider: "openai", modelId: "gpt-6-astra", tier: "flagship", status: "active",
    capabilities: ["chat", "tools", "reasoning", "long_text", "coding", "analysis"],
    contextWindow: 400_000, toolCalling: true, vision: true, reasoning: true, streaming: true, latencyClass: "standard",
  },
  {
    alias: "gpt", provider: "openai", modelId: "gpt-5.6-sol", tier: "flagship", status: "active",
    capabilities: ["chat", "tools", "reasoning", "long_text", "coding", "analysis"],
    contextWindow: 400_000, toolCalling: true, vision: true, reasoning: true, streaming: true, latencyClass: "standard",
  },
  {
    alias: "gpt", provider: "openai", modelId: "gpt-5.6-terra", tier: "balanced", status: "active",
    capabilities: ["chat", "tools", "reasoning", "long_text", "analysis"],
    contextWindow: 400_000, toolCalling: true, vision: true, reasoning: true, streaming: true, latencyClass: "standard",
  },
  {
    alias: "gpt", provider: "openai", modelId: "gpt-5.6-luna", tier: "fast", status: "active",
    capabilities: ["chat", "tools", "long_text"],
    contextWindow: 400_000, toolCalling: true, vision: true, reasoning: true, streaming: true, latencyClass: "fast",
  },
  {
    alias: "gpt", provider: "openai", modelId: "gpt-5.4-nano", tier: "light", status: "active",
    capabilities: ["classification", "extraction", "summarization", "batch"],
    contextWindow: 200_000, toolCalling: true, vision: false, reasoning: false, streaming: true,
    latencyClass: "fast", auxiliaryOnly: true,
  },

  // ---------- ANTHROPIC (alias público: claude) ----------
  {
    alias: "claude", provider: "anthropic", modelId: "claude-opus-5", tier: "flagship", status: "active",
    capabilities: ["chat", "tools", "reasoning", "long_text", "coding", "analysis"],
    contextWindow: 200_000, toolCalling: true, vision: true, reasoning: true, streaming: true, latencyClass: "standard",
  },
  {
    alias: "claude", provider: "anthropic", modelId: "claude-sonnet-4-5", tier: "balanced", status: "active",
    capabilities: ["chat", "tools", "reasoning", "long_text", "coding", "analysis"],
    contextWindow: 200_000, toolCalling: true, vision: true, reasoning: true, streaming: true, latencyClass: "standard",
  },
  {
    alias: "claude", provider: "anthropic", modelId: "claude-haiku-4-5", tier: "light", status: "active",
    capabilities: ["classification", "extraction", "summarization", "batch"],
    contextWindow: 200_000, toolCalling: true, vision: true, reasoning: false, streaming: true,
    latencyClass: "fast", auxiliaryOnly: true,
  },

  // ---------- DEEPSEEK (alias público: deepseek) ----------
  {
    alias: "deepseek", provider: "deepseek", modelId: "deepseek-v4-pro", tier: "flagship", status: "active",
    capabilities: ["chat", "tools", "reasoning", "long_text", "coding", "analysis"],
    contextWindow: 128_000, toolCalling: true, vision: false, reasoning: true, streaming: true, latencyClass: "standard",
  },
  {
    alias: "deepseek", provider: "deepseek", modelId: "deepseek-flash", tier: "fast", status: "active",
    capabilities: ["chat", "tools", "classification", "extraction", "summarization", "batch"],
    contextWindow: 128_000, toolCalling: true, vision: false, reasoning: false, streaming: true, latencyClass: "fast",
  },
];

export const ALIAS_PROVIDER: Record<ModelAlias, ProviderId> = {
  gpt: "openai",
  claude: "anthropic",
  deepseek: "deepseek",
};

export const PROVIDER_KEY_ENV: Record<ProviderId, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
};

export function sanitizeAlias(value: unknown): ModelAlias | null {
  return MODEL_ALIASES.includes(value as ModelAlias) ? (value as ModelAlias) : null;
}

export function providerApiKey(provider: ProviderId): string | null {
  return process.env[PROVIDER_KEY_ENV[provider]] ?? null;
}

// ---------------------------------------------------------------------------
// ProviderCapabilityService — disponibilidade REAL, nunca presumida.
// ---------------------------------------------------------------------------

export interface ProviderAvailability {
  provider: ProviderId;
  ok: boolean;
  models: string[];
  /** true quando o provider oferece endpoint oficial de listagem. */
  listed: boolean;
  error: string | null;
  checkedAt: number;
}

const AVAILABILITY_TTL_MS = 5 * 60 * 1000;
const availabilityCache = new Map<ProviderId, ProviderAvailability>();

async function fetchProviderModels(provider: ProviderId, apiKey: string): Promise<ProviderAvailability> {
  const base: ProviderAvailability = {
    provider, ok: false, models: [], listed: false, error: null, checkedAt: Date.now(),
  };
  try {
    const request: { url: string; headers: Record<string, string> } =
      provider === "openai"
        ? { url: "https://api.openai.com/v1/models", headers: { Authorization: `Bearer ${apiKey}` } }
        : provider === "deepseek"
          ? { url: "https://api.deepseek.com/models", headers: { Authorization: `Bearer ${apiKey}` } }
          : {
              url: "https://api.anthropic.com/v1/models?limit=100",
              headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
            };

    const response = await fetch(request.url, { headers: request.headers });
    const payload = (await response.json().catch(() => null)) as
      | { data?: Array<{ id?: string }>; error?: { message?: string } }
      | null;

    if (!response.ok) {
      return { ...base, listed: true, error: payload?.error?.message ?? `HTTP ${response.status}` };
    }
    const models = (payload?.data ?? []).map((item) => String(item?.id ?? "")).filter(Boolean);
    return { ...base, ok: true, listed: true, models };
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getProviderAvailability(
  provider: ProviderId,
  options?: { refresh?: boolean },
): Promise<ProviderAvailability> {
  const cached = availabilityCache.get(provider);
  if (!options?.refresh && cached && Date.now() - cached.checkedAt < AVAILABILITY_TTL_MS) return cached;

  const apiKey = providerApiKey(provider);
  if (!apiKey) {
    const missing: ProviderAvailability = {
      provider, ok: false, models: [], listed: false,
      error: `Credencial ${PROVIDER_KEY_ENV[provider]} ausente no servidor.`, checkedAt: Date.now(),
    };
    availabilityCache.set(provider, missing);
    return missing;
  }

  const result = await fetchProviderModels(provider, apiKey);
  availabilityCache.set(provider, result);
  return result;
}

// ---------------------------------------------------------------------------
// Resolução do flagship
// ---------------------------------------------------------------------------

export interface ResolvedModel {
  alias: ModelAlias;
  provider: ProviderId;
  entry: RegistryEntry;
  /** Como o modelo foi escolhido: configurado ou resolvido por disponibilidade. */
  resolution: "configured" | "resolved_available" | "unverified";
  availability: ProviderAvailability;
}

export interface ResolutionError {
  alias: ModelAlias;
  provider: ProviderId;
  error: string;
  availability: ProviderAvailability;
}

const SELECTABLE_STATUS: ModelStatus[] = ["active"];

function matches(models: string[], modelId: string): boolean {
  return models.some((item) => item === modelId || item.startsWith(`${modelId}-`));
}

export function aliasEntries(alias: ModelAlias, opts?: { includeAuxiliary?: boolean }): RegistryEntry[] {
  return MODEL_REGISTRY.filter(
    (entry) =>
      entry.alias === alias &&
      SELECTABLE_STATUS.includes(entry.status) &&
      (opts?.includeAuxiliary ? true : !entry.auxiliaryOnly),
  );
}

/**
 * Resolve o alias público em um model ID real do MESMO provider.
 * Nunca troca de provider por ausência de model ID (isso é fallback, não routing).
 */
export async function resolveAlias(
  alias: ModelAlias,
  options?: { refresh?: boolean },
): Promise<ResolvedModel | ResolutionError> {
  const provider = ALIAS_PROVIDER[alias];
  const availability = await getProviderAvailability(provider, options);
  const candidates = aliasEntries(alias);

  if (candidates.length === 0) {
    return { alias, provider, error: `Nenhum modelo ativo configurado para ${ALIAS_LABELS[alias]}.`, availability };
  }
  if (!availability.ok) {
    return {
      alias, provider,
      error: availability.error ?? `Provider ${provider} indisponível.`,
      availability,
    };
  }
  if (!availability.listed || availability.models.length === 0) {
    // Provider sem listagem: usa o configurado e a chamada real valida.
    return { alias, provider, entry: candidates[0], resolution: "unverified", availability };
  }

  const configured = candidates[0];
  if (matches(availability.models, configured.modelId)) {
    return { alias, provider, entry: configured, resolution: "configured", availability };
  }
  const available = candidates.find((entry) => matches(availability.models, entry.modelId));
  if (available) {
    return { alias, provider, entry: available, resolution: "resolved_available", availability };
  }
  return {
    alias, provider,
    error: `Nenhum modelo elegível de ${ALIAS_LABELS[alias]} está disponível nesta conta.`,
    availability,
  };
}

export function isResolutionError(value: ResolvedModel | ResolutionError): value is ResolutionError {
  return "error" in value;
}

/** Modelo auxiliar do MESMO provider para processamento pesado. */
export async function resolveAuxiliary(alias: ModelAlias): Promise<RegistryEntry | null> {
  const provider = ALIAS_PROVIDER[alias];
  const availability = await getProviderAvailability(provider);
  const candidates = MODEL_REGISTRY.filter(
    (entry) =>
      entry.alias === alias &&
      entry.status === "active" &&
      (entry.auxiliaryOnly || entry.tier === "fast" || entry.tier === "light"),
  );
  if (candidates.length === 0) return null;
  if (!availability.ok || !availability.listed || availability.models.length === 0) return candidates[0];
  return candidates.find((entry) => matches(availability.models, entry.modelId)) ?? null;
}

// ---------------------------------------------------------------------------
// ModelPricingRegistry — preços configuráveis, nunca inventados.
// ---------------------------------------------------------------------------

export interface ModelPrice {
  input: number;
  cachedInput?: number;
  output: number;
}

export type PricingTable = Record<string, ModelPrice>;

export function lookupPrice(
  table: PricingTable,
  provider: ProviderId,
  modelId: string,
  requestedModelId?: string,
): ModelPrice | null {
  const keys = [
    `${provider}:${modelId}`,
    `${provider}:${requestedModelId ?? ""}`,
    modelId,
    requestedModelId ?? "",
  ].filter(Boolean);

  for (const key of keys) {
    const price = table[key];
    if (price && (price.input || price.output)) return price;
  }
  // Modelos reais podem voltar com sufixo de data (ex.: claude-opus-5-20260201).
  const prefix = Object.keys(table)
    .filter((key) => keys.some((candidate) => candidate.startsWith(key) || key.startsWith(candidate)))
    .sort((a, b) => b.length - a.length)[0];
  const price = prefix ? table[prefix] : null;
  return price && (price.input || price.output) ? price : null;
}

export function estimateCost(
  price: ModelPrice | null,
  inputTokens: number,
  cachedInputTokens: number,
  outputTokens: number,
): { costUsd: number | null; status: "calculado" | "preco_nao_configurado" } {
  if (!price) return { costUsd: null, status: "preco_nao_configurado" };
  const fresh = Math.max(inputTokens - cachedInputTokens, 0);
  const cost =
    (fresh / 1_000_000) * price.input +
    (cachedInputTokens / 1_000_000) * (price.cachedInput ?? price.input) +
    (outputTokens / 1_000_000) * price.output;
  return { costUsd: Number(cost.toFixed(6)), status: "calculado" };
}
