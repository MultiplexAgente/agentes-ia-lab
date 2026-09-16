/**
 * Multiplex — TaskModelSelector.
 *
 * Classifica a tarefa e decide se há necessidade de processamento auxiliar.
 * A ordem de decisão é: capacidade → qualidade → confiabilidade → velocidade → custo.
 * O modelo principal escolhido pelo usuário SEMPRE gera a resposta final.
 */

export const TASK_TYPES = [
  "SIMPLE_CHAT",
  "QUESTION_ANSWER",
  "CUSTOMER_SUPPORT",
  "COMMERCIAL",
  "CATALOG_SEARCH",
  "PROPERTY_SEARCH",
  "PRODUCT_SEARCH",
  "TOOL_EXECUTION",
  "CREATE_CUSTOMER",
  "CREATE_ORDER",
  "QUERY_ORDER",
  "REASONING",
  "COMPARISON",
  "CODING",
  "DOCUMENT_ANALYSIS",
  "LONG_TEXT",
  "SUMMARIZATION",
  "DATA_ANALYSIS",
  "STRUCTURED_EXTRACTION",
  "OCR",
  "BATCH_PROCESSING",
  "EMBEDDING",
  "CLASSIFICATION",
  "COMPLEX_AGENT_TASK",
] as const;

export type TaskType = (typeof TASK_TYPES)[number];

const RULES: Array<{ type: TaskType; words: string[] }> = [
  { type: "CREATE_ORDER", words: ["criar pedido", "novo pedido", "quero um pedido", "fazer um pedido", "montar pedido"] },
  { type: "QUERY_ORDER", words: ["meus pedidos", "consultar pedido", "status do pedido", "pedidos recentes", "ver pedido"] },
  { type: "CREATE_CUSTOMER", words: ["cadastrar cliente", "novo cliente", "criar cliente", "adicionar cliente"] },
  { type: "PRODUCT_SEARCH", words: ["produto", "produtos", "cardápio", "cardapio", "catálogo", "catalogo", "estoque", "preço", "preco", "quanto custa", "valor"] },
  { type: "PROPERTY_SEARCH", words: ["imóvel", "imovel", "apartamento", "aluguel", "metros quadrados"] },
  { type: "CODING", words: ["código", "codigo", "script", "sql", "typescript", "javascript", "python", "webhook", "api"] },
  { type: "DATA_ANALYSIS", words: ["faturamento", "relatório", "relatorio", "métrica", "metrica", "quantos", "estatística", "estatistica", "resumo da operação", "resumo da operacao"] },
  { type: "COMPARISON", words: ["compare", "comparar", "diferença entre", "diferenca entre", "melhor opção", "melhor opcao"] },
  { type: "SUMMARIZATION", words: ["resuma", "resumo", "sintetize"] },
  { type: "STRUCTURED_EXTRACTION", words: ["extraia", "extrair dados", "em formato json", "tabela com"] },
  { type: "DOCUMENT_ANALYSIS", words: ["documento", "contrato", "planilha", "pdf", "arquivo anexo"] },
  { type: "CUSTOMER_SUPPORT", words: ["reclamação", "reclamacao", "problema", "não funciona", "nao funciona", "cancelar", "reembolso", "atraso"] },
  { type: "COMMERCIAL", words: ["desconto", "promoção", "promocao", "orçamento", "orcamento", "proposta", "negociar"] },
  { type: "REASONING", words: ["por que", "explique detalhadamente", "passo a passo", "estratégia", "estrategia", "raciocine"] },
  { type: "QUESTION_ANSWER", words: ["como funciona", "o que é", "o que e", "quais são", "quais sao", "qual é", "qual e"] },
];

const LONG_TEXT_CHARS = 4000;
const BATCH_LINES = 25;

export interface TaskAnalysis {
  taskType: TaskType;
  matched: string[];
  requiredCapabilities: string[];
  /** Precisa de modelo auxiliar antes do modelo principal responder. */
  needsAuxiliary: boolean;
  auxiliaryTask: TaskType | null;
  routingReason: string;
}

export function classifyTaskType(message: string, historyLength: number): TaskAnalysis {
  const text = message.toLowerCase();
  let best: { type: TaskType; matched: string[] } = { type: "SIMPLE_CHAT", matched: [] };
  for (const rule of RULES) {
    const matched = rule.words.filter((word) => text.includes(word));
    if (matched.length > best.matched.length) best = { type: rule.type, matched };
  }

  const lines = message.split("\n").filter((line) => line.trim().length > 0).length;
  const isLong = message.length >= LONG_TEXT_CHARS;
  const isBatch = lines >= BATCH_LINES;

  let taskType = best.type;
  if (isBatch) taskType = "BATCH_PROCESSING";
  else if (isLong && (taskType === "SIMPLE_CHAT" || taskType === "QUESTION_ANSWER")) taskType = "LONG_TEXT";
  if (historyLength > 10 && taskType === "SIMPLE_CHAT") taskType = "QUESTION_ANSWER";

  const heavy: TaskType[] = ["BATCH_PROCESSING", "LONG_TEXT", "DOCUMENT_ANALYSIS", "OCR", "STRUCTURED_EXTRACTION"];
  const needsAuxiliary = isLong || isBatch || heavy.includes(taskType);

  const requiredCapabilities = ["chat"];
  if (
    [
      "TOOL_EXECUTION", "CREATE_ORDER", "CREATE_CUSTOMER", "QUERY_ORDER",
      "PRODUCT_SEARCH", "CATALOG_SEARCH", "DATA_ANALYSIS", "PROPERTY_SEARCH",
    ].includes(taskType)
  ) {
    requiredCapabilities.push("tools");
  }
  if (["REASONING", "COMPARISON", "CODING", "COMPLEX_AGENT_TASK", "DATA_ANALYSIS"].includes(taskType)) {
    requiredCapabilities.push("reasoning");
  }
  if (needsAuxiliary) requiredCapabilities.push("long_text");

  return {
    taskType,
    matched: best.matched,
    requiredCapabilities,
    needsAuxiliary,
    auxiliaryTask: needsAuxiliary ? (isBatch ? "BATCH_PROCESSING" : "SUMMARIZATION") : null,
    routingReason: needsAuxiliary
      ? `Tarefa ${taskType}: preparação auxiliar do conteúdo antes da resposta final do modelo principal.`
      : `Tarefa ${taskType}: modelo principal escolhido pelo usuário responde diretamente.`,
  };
}

/** Verifica se o modelo tem as capacidades exigidas pela tarefa. */
export function hasCapabilities(modelCapabilities: string[], required: string[]): boolean {
  return required.every((capability) => modelCapabilities.includes(capability));
}
