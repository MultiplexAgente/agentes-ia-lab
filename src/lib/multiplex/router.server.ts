/**
 * Multiplex — roteador autônomo de modelos.
 *
 * O usuário nunca escolhe modelo: esta camada classifica a tarefa, estima a
 * complexidade e escolhe o modelo real de acordo com a estratégia da empresa.
 * O nome do modelo NUNCA é exposto ao usuário final — apenas ao administrador.
 */

export const TASK_CATEGORIES = [
  "geral",
  "catalogo",
  "vendas",
  "suporte",
  "operacoes",
  "analise",
  "codigo",
  "redacao",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_LABELS: Record<TaskCategory, string> = {
  geral: "Conversa geral",
  catalogo: "Catálogo, estoque e preços",
  vendas: "Vendas e negociação",
  suporte: "Suporte ao cliente",
  operacoes: "Operações e pedidos",
  analise: "Análise de dados",
  codigo: "Programação e automação",
  redacao: "Redação e conteúdo",
};

export const ROUTING_STRATEGIES = [
  "QUALITY_FIRST",
  "BALANCED",
  "SPEED_FIRST",
  "COST_FIRST",
] as const;

export type RoutingStrategy = (typeof ROUTING_STRATEGIES)[number];

export const STRATEGY_LABELS: Record<RoutingStrategy, string> = {
  QUALITY_FIRST: "Prioridade: qualidade",
  BALANCED: "Prioridade: equilíbrio",
  SPEED_FIRST: "Prioridade: velocidade",
  COST_FIRST: "Prioridade: custo",
};

export type Complexity = "baixa" | "media" | "alta";

/** Modelos reais confirmados na conta OpenAI conectada. */
export const MODEL_CATALOG = [
  { id: "gpt-5.6-sol", tier: "quality", reasoning: "medium" },
  { id: "gpt-5.6-terra", tier: "balanced", reasoning: "low" },
  { id: "gpt-5.6-luna", tier: "fast", reasoning: "low" },
  { id: "gpt-5.4-nano", tier: "cheap", reasoning: null },
  { id: "gpt-5.3-codex", tier: "code", reasoning: "medium" },
] as const;

export type ModelTier = (typeof MODEL_CATALOG)[number]["tier"];

export interface RoutingSettings {
  strategy: RoutingStrategy;
  /** Estratégia específica por tarefa; sobrepõe `strategy`. */
  categoryStrategies: Partial<Record<TaskCategory, RoutingStrategy>>;
  /** Preço por 1M de tokens em USD, informado pelo administrador. */
  modelPrices: Record<string, { input: number; output: number }>;
  monthlyBudgetUsd: number | null;
}

export const DEFAULT_SETTINGS: RoutingSettings = {
  strategy: "BALANCED",
  categoryStrategies: {
    catalogo: "SPEED_FIRST",
    suporte: "BALANCED",
    analise: "QUALITY_FIRST",
    codigo: "QUALITY_FIRST",
  },
  modelPrices: {},
  monthlyBudgetUsd: null,
};

const KEYWORDS: Array<{ category: TaskCategory; words: string[] }> = [
  {
    category: "catalogo",
    words: [
      "preço", "preco", "quanto custa", "valor", "estoque", "disponível", "disponivel",
      "cardápio", "cardapio", "catálogo", "catalogo", "produto", "produtos", "menu",
      "tem ", "ingredientes", "sabor",
    ],
  },
  {
    category: "operacoes",
    words: ["pedido", "pedidos", "entrega", "frete", "endereço", "endereco", "horário", "horario", "agendar", "agendamento", "status do pedido"],
  },
  {
    category: "vendas",
    words: ["desconto", "promoção", "promocao", "orçamento", "orcamento", "comprar", "fechar pedido", "proposta", "plano"],
  },
  {
    category: "suporte",
    words: ["problema", "reclamação", "reclamacao", "não funciona", "nao funciona", "erro no pedido", "cancelar", "reembolso", "atraso", "ajuda"],
  },
  {
    category: "analise",
    words: ["analise", "análise", "relatório", "relatorio", "comparar", "métrica", "metrica", "faturamento", "quantos", "estatística", "estatistica", "tendência", "tendencia"],
  },
  {
    category: "codigo",
    words: ["código", "codigo", "script", "sql", "api", "javascript", "typescript", "python", "webhook", "integração", "integracao", "função", "funcao"],
  },
  {
    category: "redacao",
    words: ["escreva", "texto", "post", "legenda", "e-mail", "email", "descrição", "descricao", "anúncio", "anuncio", "resuma", "resumo"],
  },
];

export function classifyTask(message: string): { category: TaskCategory; matched: string[] } {
  const text = message.toLowerCase();
  let best: { category: TaskCategory; matched: string[] } = { category: "geral", matched: [] };

  for (const entry of KEYWORDS) {
    const matched = entry.words.filter((word) => text.includes(word));
    if (matched.length > best.matched.length) best = { category: entry.category, matched };
  }

  return best;
}

export function estimateComplexity(message: string, historyLength: number): Complexity {
  const words = message.trim().split(/\s+/).filter(Boolean).length;
  const questions = (message.match(/\?/g) ?? []).length;
  let score = 0;

  if (words > 60) score += 2;
  else if (words > 20) score += 1;

  if (questions > 1) score += 1;
  if (historyLength > 8) score += 1;
  if (/passo a passo|detalhad|compare|explique por que|estratégia|estrategia/i.test(message)) score += 1;

  if (score >= 3) return "alta";
  if (score >= 1) return "media";
  return "baixa";
}

function pickTier(
  category: TaskCategory,
  complexity: Complexity,
  strategy: RoutingStrategy,
): ModelTier {
  if (category === "codigo") return complexity === "baixa" ? "balanced" : "code";

  switch (strategy) {
    case "QUALITY_FIRST":
      return complexity === "baixa" ? "balanced" : "quality";
    case "SPEED_FIRST":
      return complexity === "alta" ? "balanced" : "fast";
    case "COST_FIRST":
      return complexity === "alta" ? "fast" : "cheap";
    case "BALANCED":
    default:
      if (complexity === "alta") return "quality";
      if (complexity === "media") return "balanced";
      return "fast";
  }
}

function modelForTier(tier: ModelTier) {
  return MODEL_CATALOG.find((model) => model.tier === tier) ?? MODEL_CATALOG[1];
}

export interface RoutingDecision {
  category: TaskCategory;
  categoryLabel: string;
  complexity: Complexity;
  strategy: RoutingStrategy;
  model: string;
  tier: ModelTier;
  reasoningEffort: string | null;
  /** Explicação sem citar o fornecedor/modelo — pode ser exibida ao usuário. */
  publicReason: string;
  signals: string[];
  fallbackChain: string[];
}

export function routeModel(
  message: string,
  historyLength: number,
  settings: RoutingSettings,
): RoutingDecision {
  const { category, matched } = classifyTask(message);
  const complexity = estimateComplexity(message, historyLength);
  const strategy = settings.categoryStrategies[category] ?? settings.strategy;
  const tier = pickTier(category, complexity, strategy);
  const model = modelForTier(tier);

  const fallbackChain = MODEL_CATALOG.filter((m) => m.id !== model.id)
    .sort((a, b) => tierRank(a.tier) - tierRank(b.tier))
    .map((m) => m.id);

  return {
    category,
    categoryLabel: TASK_LABELS[category],
    complexity,
    strategy,
    model: model.id,
    tier: model.tier,
    reasoningEffort: model.reasoning,
    publicReason: `Tarefa identificada: ${TASK_LABELS[category]} · complexidade ${complexity}.`,
    signals: matched,
    fallbackChain,
  };
}

function tierRank(tier: ModelTier): number {
  const order: ModelTier[] = ["balanced", "quality", "fast", "cheap", "code"];
  return order.indexOf(tier);
}

export function estimateCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
  prices: RoutingSettings["modelPrices"],
  requestedModel?: string,
): { costUsd: number | null; status: "calculado" | "preco_nao_configurado" } {
  const keys = Object.keys(prices);
  const candidateKeys = [model, requestedModel].filter(Boolean) as string[];
  let price = candidateKeys.map((key) => prices[key]).find((item) => item && (item.input || item.output));
  if (!price) {
    // O modelo real pode voltar com sufixo de data (ex.: gpt-5.6-luna-2026-08-01).
    const prefixKey = keys
      .filter((key) => candidateKeys.some((candidate) => candidate.startsWith(key) || key.startsWith(candidate)))
      .sort((a, b) => b.length - a.length)[0];
    if (prefixKey) price = prices[prefixKey];
  }
  if (!price || (!price.input && !price.output)) {
    return { costUsd: null, status: "preco_nao_configurado" };
  }
  const cost = (promptTokens / 1_000_000) * price.input + (completionTokens / 1_000_000) * price.output;
  return { costUsd: Number(cost.toFixed(6)), status: "calculado" };
}
