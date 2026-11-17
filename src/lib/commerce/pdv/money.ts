/**
 * BonaSoft Commerce — Utilitários de Precisão Monetária
 *
 * Garante que todas as operações financeiras e de caixa utilizem cálculos
 * baseados em centavos inteiros (integers) ou representações decimais seguras,
 * prevenindo erros clássicos de arredondamento de ponto flutuante em JavaScript.
 */

/** Converte reais (float ou string) para centavos inteiros */
export function toCents(amount: number | string | null | undefined): number {
  if (amount === null || amount === undefined || amount === "") return 0;
  const num = typeof amount === "string" ? parseFloat(amount.replace(",", ".")) : amount;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/** Converte centavos inteiros para reais (float formatado com 2 casas decimais) */
export function fromCents(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

/** Formata centavos ou valor em moeda brasileira (BRL) */
export function formatBrlFromCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBrl(amount: number | string | null | undefined): string {
  return fromCents(toCents(amount)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Soma precisa de valores monetários */
export function addMoney(...amounts: Array<number | string | null | undefined>): number {
  const totalCents = amounts.reduce<number>((acc, cur) => acc + toCents(cur), 0);
  return fromCents(totalCents);
}

/** Subtração precisa de valores monetários (a - b) */
export function subtractMoney(a: number | string, b: number | string): number {
  return fromCents(toCents(a) - toCents(b));
}

/** Multiplica preço unitário por quantidade (suporta quantidade fracionada/decimal para pesáveis) */
export function multiplyMoney(unitPrice: number | string, quantity: number | string): number {
  const priceCents = toCents(unitPrice);
  const qty = typeof quantity === "string" ? parseFloat(quantity.replace(",", ".")) : quantity;
  if (isNaN(qty) || qty <= 0) return 0;
  return fromCents(Math.round(priceCents * qty));
}

/** Aplica desconto em valor ou percentual de forma segura */
export function calculateDiscount(
  baseAmount: number | string,
  discountValue: number | string,
  type: "fixed" | "percentage" = "fixed"
): number {
  const baseCents = toCents(baseAmount);
  if (baseCents <= 0) return 0;

  if (type === "percentage") {
    const pct = typeof discountValue === "string" ? parseFloat(discountValue) : discountValue;
    if (isNaN(pct) || pct <= 0) return 0;
    const clampedPct = Math.min(100, pct);
    const discountCents = Math.round((baseCents * clampedPct) / 100);
    return fromCents(discountCents);
  }

  const fixedCents = toCents(discountValue);
  return fromCents(Math.min(baseCents, Math.max(0, fixedCents)));
}
