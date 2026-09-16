import type { SupabaseClient } from "@supabase/supabase-js";

import type { TaskCategory } from "./router.server";

export interface CompanyContext {
  prompt: string;
  sources: string[];
  productCount: number;
  knowledgeCount: number;
  memoryCount: number;
  agentId: string | null;
}

interface ProductRow {
  name: string;
  description: string | null;
  price: number | string | null;
  available: boolean | null;
  preparation_time_minutes: number | null;
  product_categories: { name: string } | null;
}

const STOP_WORDS = new Set([
  "a", "ao", "aos", "as", "com", "como", "da", "das", "de", "do", "dos", "e", "em", "eu", "me",
  "o", "os", "para", "por", "que", "qual", "quais", "um", "uma", "vocês", "voces",
]);

function terms(message: string): string[] {
  return [...new Set(message.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/).filter((part) => part.length >= 3 && !STOP_WORDS.has(part)))].slice(0, 8);
}

function money(value: number | string | null): string {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function rankText(text: string, queryTerms: string[]): number {
  const normalized = text.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return queryTerms.reduce((score, term) => score + (normalized.includes(term) ? 1 : 0), 0);
}

export async function buildCompanyContext(
  supabase: SupabaseClient,
  companyId: string,
  companyName: string,
  message: string,
  category: TaskCategory,
  customerId?: string | null,
): Promise<CompanyContext> {
  const sources: string[] = [];
  const blocks: string[] = [`Empresa atendida: ${companyName}.`];
  const queryTerms = terms(message);
  let productCount = 0;
  let knowledgeCount = 0;
  let memoryCount = 0;

  const { data: agent } = await supabase
    .from("agents")
    .select("id, system_prompt")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const activeAgent = agent as { id?: string; system_prompt?: string | null } | null;
  if (activeAgent?.system_prompt) {
    sources.push("agent");
    blocks.push(`INSTRUÇÕES ESPECÍFICAS DA EMPRESA:\n${activeAgent.system_prompt.slice(0, 3000)}`);
  }

  if (category === "catalogo" || category === "vendas") {
    const { data } = await supabase
      .from("products")
      .select("name, description, price, available, preparation_time_minutes, product_categories(name)")
      .eq("company_id", companyId)
      .order("name", { ascending: true })
      .limit(80);
    const ranked = ((data ?? []) as unknown as ProductRow[])
      .map((row) => ({ row, score: rankText(`${row.name} ${row.description ?? ""} ${row.product_categories?.name ?? ""}`, queryTerms) }))
      .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name))
      .filter((entry, index) => entry.score > 0 || index < 12)
      .slice(0, 12)
      .map((entry) => entry.row);
    productCount = ranked.length;
    if (ranked.length) {
      sources.push("products");
      blocks.push("CATÁLOGO RELEVANTE (dados atuais):\n" + ranked.map((item) => {
        const status = item.available === false ? "indisponível" : "disponível";
        const categoryName = item.product_categories?.name ? ` · ${item.product_categories.name}` : "";
        const prep = item.preparation_time_minutes ? ` · preparo ~${item.preparation_time_minutes}min` : "";
        return `- ${item.name}: ${money(item.price)} · ${status}${categoryName}${prep}${item.description ? ` — ${item.description}` : ""}`;
      }).join("\n"));
    } else {
      blocks.push("CATÁLOGO: não há produto relevante cadastrado. Não invente itens ou preços.");
    }
  }

  if (category === "operacoes" || /hor[aá]rio|aberto|fecha|funciona/i.test(message)) {
    const { data: hours } = await supabase
      .from("business_hours")
      .select("day_of_week, open_time, close_time, closed")
      .eq("company_id", companyId)
      .limit(14);
    if (hours?.length) {
      sources.push("business_hours");
      blocks.push(`HORÁRIOS REAIS: ${JSON.stringify(hours)}`);
    }
  }

  const [{ data: base }, { data: items }] = await Promise.all([
    supabase.from("knowledge_base").select("title, category, content").eq("company_id", companyId).eq("active", true).limit(50),
    supabase.from("knowledge_items").select("subject, item_type, data").eq("company_id", companyId).eq("active", true).limit(50),
  ]);
  const knowledge = [
    ...((base ?? []) as Array<{ title: string; category: string; content: string }>).map((row) => ({
      text: `${row.title} (${row.category}): ${row.content}`,
      source: "knowledge_base",
    })),
    ...((items ?? []) as Array<{ subject: string; item_type: string; data: unknown }>).map((row) => ({
      text: `${row.subject} (${row.item_type}): ${JSON.stringify(row.data)}`,
      source: "knowledge_items",
    })),
  ].map((entry) => ({ ...entry, score: rankText(entry.text, queryTerms) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  if (knowledge.length) {
    knowledgeCount = knowledge.length;
    for (const source of new Set(knowledge.map((item) => item.source))) sources.push(source);
    blocks.push(`CONHECIMENTO RELEVANTE:\n${knowledge.map((item) => `- ${item.text.slice(0, 1200)}`).join("\n")}`);
  }

  if (customerId) {
    const { data: memories } = await supabase
      .from("agent_memory")
      .select("memory_type, key, value")
      .eq("company_id", companyId)
      .eq("customer_id", customerId)
      .limit(20);
    const relevant = ((memories ?? []) as Array<{ memory_type: string; key: string; value: string }>)
      .map((row) => ({ row, score: rankText(`${row.key} ${row.value}`, queryTerms) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => entry.row);
    if (relevant.length) {
      memoryCount = relevant.length;
      sources.push("agent_memory");
      blocks.push(`MEMÓRIAS RELEVANTES:\n${relevant.map((row) => `- ${row.key}: ${row.value}`).join("\n")}`);
    }
  }

  blocks.push("Se a resposta depender de informação empresarial ausente acima, diga que precisa confirmar; não invente.");
  return {
    prompt: blocks.join("\n\n"),
    sources,
    productCount,
    knowledgeCount,
    memoryCount,
    agentId: activeAgent?.id ?? null,
  };
}