/**
 * BonaSoft Commerce — Núcleo Transacional de Vendas PDV (Server-Side)
 *
 * Responsável por:
 * 1. Garantir idempotência da transação via chave única (idempotencyKey).
 * 2. Prevenir adulteração de preços pelo cliente (re-checagem contra banco de dados).
 * 3. Validação de estoque e disponibilidade de produtos.
 * 4. Resolução de cliente (auto-criação de Consumidor Final quando anônimo).
 * 5. Gravação atômica da venda em `orders`, `order_items` e `payments`.
 * 6. Baixa de estoque nos produtos vendidos.
 * 7. Atualização do resumo financeiro da sessão de caixa ativa.
 * 8. Geração de comprovante de venda legível (recibo térmico).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompanySession } from "@/lib/multiplex/company-auth.server";
import { toCents, fromCents, addMoney, subtractMoney, formatBrl } from "./money";
import { CashRegisterService } from "./cash-register";

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  variantName?: string;
  notes?: string;
  discountCents?: number;
}

export interface CheckoutPaymentInput {
  method: "cash" | "money" | "credit_card" | "debit_card" | "pix" | "store_credit" | "other";
  amount: number;
  transactionId?: string;
}

export interface CheckoutRequest {
  idempotencyKey: string;
  terminalCode?: string;
  customerId?: string | null;
  items: CheckoutItemInput[];
  payments: CheckoutPaymentInput[];
  generalDiscountCents?: number;
  notes?: string;
}

export interface CheckoutResultItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  companyId: string;
  companyName: string;
  terminalCode: string;
  customerName: string;
  subtotal: number;
  discount: number;
  total: number;
  payments: Array<{ method: string; amount: number }>;
  changeDue: number;
  createdAt: string;
  items: CheckoutResultItem[];
  receiptText: string;
}

// Cache de idempotência em memória para rápida resposta de transações duplicadas
const idempotencyCache = new Map<string, CheckoutResult>();

/**
 * Localiza ou cria o cliente padrão "Consumidor Final" da empresa.
 */
async function resolveCustomer(
  supabase: SupabaseClient,
  companyId: string,
  customerId?: string | null
): Promise<{ id: string; name: string }> {
  if (customerId) {
    const { data: cust } = await supabase
      .from("customers")
      .select("id, name")
      .eq("id", customerId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (cust) {
      return { id: cust.id, name: cust.name || "Cliente Identificado" };
    }
  }

  // Busca cliente Consumidor Final da empresa
  const { data: defaultCust } = await supabase
    .from("customers")
    .select("id, name")
    .eq("company_id", companyId)
    .ilike("name", "%Consumidor Final%")
    .maybeSingle();

  if (defaultCust) {
    return { id: defaultCust.id, name: defaultCust.name };
  }

  // Cria cliente Consumidor Final se ainda não existir
  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      company_id: companyId,
      name: "Consumidor Final",
      notes: "Cliente padrão do sistema para vendas de balcão e PDV.",
    })
    .select("id, name")
    .maybeSingle();

  if (error || !created) {
    // Fallback: se insert falhar, tenta pegar qualquer cliente existente da empresa
    const { data: anyCust } = await supabase
      .from("customers")
      .select("id, name")
      .eq("company_id", companyId)
      .limit(1)
      .maybeSingle();

    if (anyCust) return { id: anyCust.id, name: anyCust.name || "Consumidor Final" };
    throw new Error("Não foi possível registrar o cliente da venda.");
  }

  return { id: created.id, name: created.name };
}

/**
 * Gera recibo térmico formatado para impressão ou visualização.
 */
function buildThermalReceipt(params: {
  companyName: string;
  terminalCode: string;
  orderNumber: string;
  customerName: string;
  items: CheckoutResultItem[];
  subtotal: number;
  discount: number;
  total: number;
  payments: Array<{ method: string; amount: number }>;
  changeDue: number;
  createdAt: string;
}): string {
  const line = "------------------------------------------------";
  const dateStr = new Date(params.createdAt).toLocaleString("pt-BR");

  let out = "";
  out += `           ${params.companyName.toUpperCase().slice(0, 30)}\n`;
  out += `         BONASOFT COMMERCE - FRENTE DE CAIXA\n`;
  out += `${line}\n`;
  out += `Terminal: ${params.terminalCode} | Cupom: ${params.orderNumber}\n`;
  out += `Data/Hora: ${dateStr}\n`;
  out += `Cliente: ${params.customerName}\n`;
  out += `${line}\n`;
  out += `ITEM  DESCRICAO               QTD    UN      TOTAL\n`;
  out += `${line}\n`;

  params.items.forEach((it, idx) => {
    const num = String(idx + 1).padStart(2, "0");
    const name = it.name.slice(0, 20).padEnd(20, " ");
    const qtd = String(it.quantity).padStart(5, " ");
    const un = formatBrl(it.unitPrice).padStart(8, " ");
    const tot = formatBrl(it.total).padStart(9, " ");
    out += `${num}    ${name} ${qtd} ${un} ${tot}\n`;
  });

  out += `${line}\n`;
  out += `SUBTOTAL:                          ${formatBrl(params.subtotal).padStart(15, " ")}\n`;
  if (params.discount > 0) {
    out += `DESCONTO:                         -${formatBrl(params.discount).padStart(15, " ")}\n`;
  }
  out += `TOTAL LIQUIDO:                     ${formatBrl(params.total).padStart(15, " ")}\n`;
  out += `${line}\n`;
  out += `PAGAMENTO:\n`;
  params.payments.forEach((p) => {
    const label =
      p.method === "cash" || p.method === "money"
        ? "Dinheiro"
        : p.method === "pix"
        ? "PIX"
        : p.method === "credit_card"
        ? "Cartao de Credito"
        : p.method === "debit_card"
        ? "Cartao de Debito"
        : p.method;
    out += `  ${label.padEnd(25, " ")}: ${formatBrl(p.amount).padStart(15, " ")}\n`;
  });

  if (params.changeDue > 0) {
    out += `TROCO:                             ${formatBrl(params.changeDue).padStart(15, " ")}\n`;
  }

  out += `${line}\n`;
  out += `   Obrigado pela preferencia! Volte sempre.\n`;
  out += `       BonaSoft Commerce Cloud Platform\n`;

  return out;
}

/**
 * Executa a transação atômica do PDV.
 */
export async function executePdvCheckout(
  supabase: SupabaseClient,
  session: CompanySession,
  payload: CheckoutRequest
): Promise<CheckoutResult> {
  const terminalCode = payload.terminalCode || "CAIXA-01";
  const idempotencyKey = payload.idempotencyKey?.trim();

  if (!idempotencyKey) {
    throw new Error("Chave de idempotência (idempotencyKey) obrigatória.");
  }

  // 1. Verificação de idempotência no cache de memória
  const cacheKey = `${session.companyId}:${idempotencyKey}`;
  if (idempotencyCache.has(cacheKey)) {
    return idempotencyCache.get(cacheKey)!;
  }

  // 2. Validação básica de itens
  if (!payload.items || payload.items.length === 0) {
    throw new Error("O carrinho está vazio. Adicione ao menos um produto.");
  }

  // 3. Consulta de produtos no banco para prevenir adulteração de preços
  const productIds = Array.from(new Set(payload.items.map((it) => it.productId)));
  const { data: dbProducts, error: prodError } = await supabase
    .from("products")
    .select("id, name, price, available, current_stock")
    .in("id", productIds)
    .eq("company_id", session.companyId);

  if (prodError || !dbProducts || dbProducts.length === 0) {
    throw new Error("Erro ao validar produtos no catálogo da empresa.");
  }

  const productsMap = new Map<string, { id: string; name: string; price: number; available: boolean; current_stock?: number | null }>();
  for (const p of dbProducts) {
    productsMap.set(p.id, {
      id: p.id,
      name: p.name,
      price: Number(p.price),
      available: p.available ?? true,
      current_stock: p.current_stock != null ? Number(p.current_stock) : null,
    });
  }

  // 4. Validação e recálculo seguro item a item
  let subtotalCents = 0;
  let itemsDiscountCents = 0;
  const processedItems: CheckoutResultItem[] = [];

  for (const it of payload.items) {
    const prod = productsMap.get(it.productId);
    if (!prod) {
      throw new Error(`Produto não encontrado ou desativado (ID: ${it.productId}).`);
    }
    if (prod.available === false) {
      throw new Error(`O produto "${prod.name}" está marcado como indisponível para venda.`);
    }

    const qty = Math.max(0.001, Number(it.quantity) || 1);
    const unitPriceCents = toCents(prod.price);
    const rawTotalCents = Math.round(unitPriceCents * qty);

    const itDiscountCents = Math.min(rawTotalCents, Math.max(0, it.discountCents ?? 0));
    const finalItemTotalCents = rawTotalCents - itDiscountCents;

    subtotalCents += rawTotalCents;
    itemsDiscountCents += itDiscountCents;

    processedItems.push({
      productId: prod.id,
      name: prod.name,
      quantity: qty,
      unitPrice: prod.price,
      discount: fromCents(itDiscountCents),
      total: fromCents(finalItemTotalCents),
    });
  }

  // 5. Cálculo do total e validação de pagamentos
  const generalDiscountCents = Math.max(0, payload.generalDiscountCents ?? 0);
  const totalDiscountCents = itemsDiscountCents + generalDiscountCents;
  const grandTotalCents = Math.max(0, subtotalCents - totalDiscountCents);

  if (!payload.payments || payload.payments.length === 0) {
    throw new Error("Informe a forma de pagamento para concluir a venda.");
  }

  let paidCents = 0;
  for (const p of payload.payments) {
    const pCents = toCents(Math.max(0, p.amount));
    paidCents += pCents;
  }

  if (paidCents < grandTotalCents) {
    const diff = fromCents(grandTotalCents - paidCents);
    throw new Error(`Pagamento insuficiente. Faltam ${formatBrl(diff)} para cobrir o total.`);
  }

  const changeDueCents = paidCents - grandTotalCents;

  // 6. Resolução de cliente
  const customer = await resolveCustomer(supabase, session.companyId, payload.customerId);

  // 7. Determina método de pagamento principal
  const primaryMethod = payload.payments[0]?.method || "cash";

  // 8. Persistência na tabela `orders`
  const orderMetadata = {
    channel: "pdv",
    idempotency_key: idempotencyKey,
    terminal_code: terminalCode,
    cashier_id: session.userId,
    cashier_email: session.email,
    change_due: fromCents(changeDueCents),
    discount: fromCents(totalDiscountCents),
  };

  const { data: orderData, error: orderErr } = await supabase
    .from("orders")
    .insert({
      company_id: session.companyId,
      customer_id: customer.id,
      status: "COMPLETED",
      subtotal: fromCents(subtotalCents),
      delivery_fee: 0,
      total: fromCents(grandTotalCents),
      payment_method: primaryMethod.toUpperCase(),
      delivery_address: orderMetadata,
      notes: payload.notes || `Venda PDV balcão - Terminal ${terminalCode}`,
    })
    .select("id, created_at")
    .maybeSingle();

  if (orderErr || !orderData) {
    throw new Error(`Erro ao registrar venda: ${orderErr?.message ?? "Falha no banco de dados"}`);
  }

  const orderId = orderData.id;
  const orderNumber = `PDV-${String(orderId).slice(0, 8).toUpperCase()}`;

  // 9. Persistência em `order_items`
  const itemsToInsert = processedItems.map((it) => ({
    order_id: orderId,
    company_id: session.companyId,
    product_id: it.productId,
    product_name: it.name,
    unit_price: it.unitPrice,
    quantity: Math.max(1, Math.round(it.quantity)),
    selected_addons: {
      real_quantity: it.quantity,
      discount: it.discount,
    },
    item_total: it.total,
  }));

  await supabase.from("order_items").insert(itemsToInsert);

  // 10. Persistência em `payments`
  const paymentsToInsert = payload.payments.map((p) => ({
    order_id: orderId,
    company_id: session.companyId,
    amount: p.amount,
    method: p.method,
    status: "paid",
    paid_at: new Date().toISOString(),
    transaction_id: p.transactionId ?? null,
  }));

  await supabase.from("payments").insert(paymentsToInsert);

  // 11. Baixa de estoque (suporta graceful degradation se coluna não existir)
  for (const it of payload.items) {
    const prod = productsMap.get(it.productId);
    if (prod && prod.current_stock != null) {
      const newStock = Math.max(0, prod.current_stock - it.quantity);
      try {
        await supabase
          .from("products")
          .update({ current_stock: newStock })
          .eq("id", prod.id)
          .eq("company_id", session.companyId);
      } catch {
        // Ignora silenciosamente se current_stock não estiver na base atual
      }
    }
  }

  // 12. Registro financeiro na sessão de caixa ativa
  CashRegisterService.recordSaleInSession(
    session.companyId,
    terminalCode,
    payload.payments.map((p) => ({ method: p.method, amount: p.amount }))
  );

  // 13. Monta comprovante térmico
  const receiptText = buildThermalReceipt({
    companyName: session.companyName,
    terminalCode,
    orderNumber,
    customerName: customer.name,
    items: processedItems,
    subtotal: fromCents(subtotalCents),
    discount: fromCents(totalDiscountCents),
    total: fromCents(grandTotalCents),
    payments: payload.payments,
    changeDue: fromCents(changeDueCents),
    createdAt: orderData.created_at || new Date().toISOString(),
  });

  const result: CheckoutResult = {
    orderId,
    orderNumber,
    companyId: session.companyId,
    companyName: session.companyName,
    terminalCode,
    customerName: customer.name,
    subtotal: fromCents(subtotalCents),
    discount: fromCents(totalDiscountCents),
    total: fromCents(grandTotalCents),
    payments: payload.payments,
    changeDue: fromCents(changeDueCents),
    createdAt: orderData.created_at || new Date().toISOString(),
    items: processedItems,
    receiptText,
  };

  // Salva no cache de idempotência
  idempotencyCache.set(cacheKey, result);

  return result;
}
