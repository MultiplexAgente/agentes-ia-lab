import type { SupabaseClient } from "@supabase/supabase-js";

export interface CompanyContext {
  prompt: string;
  sources: string[];
  productCount: number;
}

interface ProductRow {
  name: string;
  description: string | null;
  price: number | string | null;
  available: boolean | null;
  preparation_time_minutes: number | null;
  ingredients: string[] | null;
  product_categories: { name: string } | null;
}

function money(value: number | string | null): string {
  const n = Number(value ?? 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Monta o contexto REAL da empresa a partir do Supabase (catálogo, horários,
 * FAQ). Nada é inventado: o que não existe simplesmente não entra no prompt.
 */
export async function buildCompanyContext(
  supabase: SupabaseClient,
  companyId: string,
  companyName: string,
): Promise<CompanyContext> {
  const sources: string[] = [];
  const blocks: string[] = [`Empresa atendida: ${companyName}.`];

  const [{ data: products }, { data: hours }, { data: faq }] = await Promise.all([
    supabase
      .from("products")
      .select("name, description, price, available, preparation_time_minutes, ingredients, product_categories(name)")
      .eq("company_id", companyId)
      .order("name", { ascending: true })
      .limit(200),
    supabase
      .from("business_hours")
      .select("*")
      .eq("company_id", companyId)
      .limit(20),
    supabase
      .from("faq")
      .select("question, answer")
      .eq("company_id", companyId)
      .limit(40),
  ]);

  const rows = (products ?? []) as unknown as ProductRow[];
  if (rows.length) {
    sources.push("products");
    const grouped = new Map<string, ProductRow[]>();
    for (const row of rows) {
      const key = row.product_categories?.name ?? "Outros";
      const list = grouped.get(key) ?? [];
      list.push(row);
      grouped.set(key, list);
    }

    const lines: string[] = ["CATÁLOGO REAL (preços e disponibilidade atuais do banco de dados):"];
    for (const [category, items] of grouped) {
      lines.push(`- ${category}:`);
      for (const item of items) {
        const status = item.available === false ? "INDISPONÍVEL" : "disponível";
        const prep = item.preparation_time_minutes ? ` · preparo ~${item.preparation_time_minutes}min` : "";
        const desc = item.description ? ` — ${item.description}` : "";
        lines.push(`  · ${item.name}: ${money(item.price)} (${status})${prep}${desc}`);
      }
    }
    blocks.push(lines.join("\n"));
  } else {
    blocks.push("CATÁLOGO: nenhum produto cadastrado no banco. Diga isso ao usuário e não invente itens ou preços.");
  }

  if (hours?.length) {
    sources.push("business_hours");
    blocks.push(`HORÁRIOS (dados reais): ${JSON.stringify(hours)}`);
  }

  if (faq?.length) {
    sources.push("faq");
    blocks.push(
      "FAQ REAL:\n" +
        (faq as Array<{ question: string; answer: string }>)
          .map((item) => `- ${item.question} → ${item.answer}`)
          .join("\n"),
    );
  }

  return { prompt: blocks.join("\n\n"), sources, productCount: rows.length };
}
