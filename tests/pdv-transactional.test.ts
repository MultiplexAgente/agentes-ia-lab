import { describe, it, expect, beforeEach } from "vitest";
import {
  toCents,
  fromCents,
  addMoney,
  subtractMoney,
  multiplyMoney,
  calculateDiscount,
  formatBrl,
} from "../src/lib/commerce/pdv/money";
import { PdvCartManager } from "../src/lib/commerce/pdv/cart";
import { CashRegisterService } from "../src/lib/commerce/pdv/cash-register";
import { executePdvCheckout } from "../src/lib/commerce/pdv/transaction.server";

describe("HUG POS (by BonaSoft) — Módulo de Precisão Monetária (PDV)", () => {
  it("converte valores decimais para centavos inteiros e vice-versa sem perda por float", () => {
    // Clássico problema 0.1 + 0.2 em ponto flutuante
    const cent1 = toCents(0.1);
    const cent2 = toCents(0.2);
    expect(cent1 + cent2).toBe(30);
    expect(fromCents(cent1 + cent2)).toBe(0.3);

    // Arredondamentos e dízimas
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.004)).toBe(0);
    expect(toCents(0.006)).toBe(1);
    expect(fromCents(1999)).toBe(19.99);
  });

  it("soma, subtrai e multiplica valores monetários com exatidão", () => {
    expect(addMoney(10.5, 5.25)).toBe(15.75);
    expect(subtractMoney(100.0, 33.33)).toBe(66.67);
    expect(multiplyMoney(12.5, 3)).toBe(37.5);
    // Produto vendido fracionado por peso (ex: 0.455 kg a R$ 38,90/kg)
    const totalCarne = multiplyMoney(38.9, 0.455);
    expect(totalCarne).toBe(17.7);
  });

  it("calcula descontos nominais e percentuais com teto", () => {
    // 10% de desconto em R$ 150,00
    const descPerc = calculateDiscount(150.0, 10, "percentage");
    expect(descPerc).toBe(15.0);

    // Desconto fixo de R$ 25,00
    const descFixo = calculateDiscount(100.0, 25.0, "fixed");
    expect(descFixo).toBe(25.0);

    // Desconto não pode ultrapassar o valor do produto
    const descExcesso = calculateDiscount(50.0, 80.0, "fixed");
    expect(descExcesso).toBe(50.0);
  });

  it("formata valores no padrão da moeda brasileira (BRL)", () => {
    const formatted = formatBrl(1234.5);
    expect(formatted).toContain("1.234,50");
  });
});

describe("HUG POS (by BonaSoft) — Gerenciador de Carrinho PDV", () => {
  let cart: PdvCartManager;

  beforeEach(() => {
    cart = new PdvCartManager();
  });

  it("adiciona produtos inteiros e fracionados calculando subtotal corretamente", () => {
    // Adiciona produto unitário
    cart.addItem(
      {
        id: "prod-1",
        name: "Dipirona 500mg",
        price: 12.5,
        unit: "UN",
      },
      2
    );

    // Adiciona produto pesado fracionado (mercado/açougue)
    cart.addItem(
      {
        id: "prod-2",
        name: "Queijo Muçarela Fatiado",
        price: 48.0,
        unit: "KG",
      },
      0.35
    );

    const totals = cart.calculateTotals();
    // 2 * 12.50 = 25.00
    // 0.35 * 48.00 = 16.80
    // Subtotal = 41.80
    expect(totals.subtotal).toBe(41.8);
    expect(totals.total).toBe(41.8);
    expect(cart.items.length).toBe(2);
  });

  it("aplica descontos por item e desconto geral no carrinho", () => {
    cart.addItem(
      {
        id: "prod-camisa",
        name: "Camisa Algodão",
        price: 100.0,
      },
      1
    );

    // Desconto no item de R$ 10,00
    cart.setItemDiscount(0, 10.0);

    // Desconto geral na venda de 5%
    cart.setGeneralDiscount(5, "percentage");

    const totals = cart.calculateTotals();
    // Subtotal: 100.00
    // Desconto item: 10.00 -> base 90.00
    // Desconto geral 5% sobre 90.00 = 4.50
    // Total descontos: 14.50
    // Total líquido: 85.50
    expect(totals.subtotal).toBe(100.0);
    expect(totals.itemsDiscount).toBe(10.0);
    expect(totals.generalDiscount).toBe(4.5);
    expect(totals.totalDiscount).toBe(14.5);
    expect(totals.total).toBe(85.5);
  });

  it("calcula divisão de pagamentos (split) e troco corretamente", () => {
    cart.addItem(
      {
        id: "prod-tv",
        name: "Smart TV 50",
        price: 2000.0,
      },
      1
    );

    // Pagamento dividido: R$ 1500 no cartão e R$ 600 em dinheiro (troco R$ 100)
    cart.addPayment({ method: "credit_card", amount: 1500.0 });
    cart.addPayment({ method: "money", amount: 500.0, receivedAmount: 600.0 });

    const totals = cart.calculateTotals();
    expect(totals.total).toBe(2000.0);
    expect(totals.totalPaid).toBe(2000.0);
    expect(totals.totalChange).toBe(100.0);
    expect(totals.remainingAmount).toBe(0.0);
    expect(totals.isFullyPaid).toBe(true);
  });
});

describe("HUG POS (by BonaSoft) — Gestão de Caixa e Movimentações (Cash Register)", () => {
  const dummySupabase = {
    from: () => ({
      select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ order: () => ({ maybeSingle: async () => ({ data: null }) }) }) }) }) }),
      insert: async () => ({ error: null }),
    }),
  } as any;

  it("abre sessão de caixa com saldo inicial", async () => {
    const session = await CashRegisterService.openSession(dummySupabase, {
      companyId: "comp-teste-1",
      terminalCode: "CAIXA-01",
      operatorId: "user-op-1",
      operatorEmail: "operador@bonasoft.com",
      initialCashAmount: 150.0, // Fundo de troco
    });

    expect(session.status).toBe("OPEN");
    expect(session.initialCashAmount).toBe(150.0);
    expect(session.terminalCode).toBe("CAIXA-01");
  });

  it("registra suprimento e sangria na sessão ativa", async () => {
    // Suprimento (reforço de troco) de R$ 50,00
    const suprimento = await CashRegisterService.registerMovement(dummySupabase, {
      companyId: "comp-teste-1",
      terminalCode: "CAIXA-01",
      type: "SUPRIMENTO",
      amount: 50.0,
      reason: "Reforço de moedas",
      operatorEmail: "operador@bonasoft.com",
    });
    expect(suprimento.type).toBe("SUPRIMENTO");
    expect(suprimento.amount).toBe(50.0);

    // Sangria (retirada de segurança) de R$ 30,00
    const sangria = await CashRegisterService.registerMovement(dummySupabase, {
      companyId: "comp-teste-1",
      terminalCode: "CAIXA-01",
      type: "SANGRIA",
      amount: 30.0,
      reason: "Sangria de segurança para cofre",
      operatorEmail: "operador@bonasoft.com",
    });
    expect(sangria.type).toBe("SANGRIA");
    expect(sangria.amount).toBe(30.0);
  });

  it("registra vendas acumuladas por meio de pagamento", () => {
    CashRegisterService.recordSaleInSession("comp-teste-1", "CAIXA-01", [
      { method: "cash", amount: 100.0 },
      { method: "credit_card", amount: 250.0 },
      { method: "pix", amount: 75.0 },
    ]);
  });

  it("fecha a sessão calculando divergência de caixa com precisão", async () => {
    // Saldo inicial: 150
    // Suprimentos: +50
    // Sangrias: -30
    // Vendas em dinheiro: +100
    // Total esperado em dinheiro: 150 + 50 - 30 + 100 = 270.00
    // Se o operador contar 270.00 -> divergência = 0
    const closed = await CashRegisterService.closeSession(dummySupabase, {
      companyId: "comp-teste-1",
      terminalCode: "CAIXA-01",
      countedCash: 270.0,
      notes: "Fechamento sem divergências.",
    });

    expect(closed.status).toBe("CLOSED");
    expect(closed.closingReport?.expectedCash).toBe(270.0);
    expect(closed.closingReport?.countedCash).toBe(270.0);
    expect(closed.closingReport?.divergence).toBe(0.0);
  });
});

describe("HUG POS (by BonaSoft) — Execução Transacional e Idempotência (Checkout)", () => {
  const mockProducts = [
    {
      id: "prod-uuid-1",
      company_id: "comp-check-1",
      name: "Amoxicilina 500mg",
      price: 35.5,
      available: true,
      current_stock: 50,
    },
    {
      id: "prod-uuid-2",
      company_id: "comp-check-1",
      name: "Paracetamol 750mg",
      price: 10.0,
      available: true,
      current_stock: 100,
    },
  ];

  const fakeSession = {
    userId: "usr-1",
    email: "caixa@bonasoft.com",
    companyId: "comp-check-1",
    companyName: "Farmácia BonaSoft Matriz",
    role: "admin",
  };

  const createMockSupabase = () => {
    return {
      from: (table: string) => {
        if (table === "products") {
          return {
            select: () => ({
              in: () => ({
                eq: async () => ({ data: mockProducts, error: null }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: async () => ({ error: null }),
              }),
            }),
          };
        }
        if (table === "customers") {
          return {
            select: () => ({
              eq: () => ({
                ilike: () => ({
                  maybeSingle: async () => ({
                    data: { id: "cust-final-id", name: "Consumidor Final" },
                  }),
                }),
              }),
            }),
            insert: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: { id: "cust-final-id", name: "Consumidor Final" },
                }),
              }),
            }),
          };
        }
        if (table === "orders") {
          return {
            insert: () => ({
              select: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "order-pdv-12345678",
                    created_at: new Date().toISOString(),
                  },
                }),
              }),
            }),
          };
        }
        if (table === "order_items" || table === "payments") {
          return {
            insert: async () => ({ error: null }),
          };
        }
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
          insert: async () => ({ error: null }),
        };
      },
    } as any;
  };

  it("executa checkout com recálculo seguro de preços do banco e gera recibo térmico", async () => {
    const supabase = createMockSupabase();

    const checkoutReq = {
      idempotencyKey: "sale-key-001",
      terminalCode: "PDV-01",
      items: [
        { productId: "prod-uuid-1", quantity: 2 }, // 2 * 35.50 = 71.00
        { productId: "prod-uuid-2", quantity: 1 }, // 1 * 10.00 = 10.00
      ],
      payments: [
        { method: "cash" as const, amount: 100.0 }, // Total: 81.00, Troco: 19.00
      ],
    };

    const result = await executePdvCheckout(supabase, fakeSession, checkoutReq);

    expect(result.subtotal).toBe(81.0);
    expect(result.total).toBe(81.0);
    expect(result.changeDue).toBe(19.0);
    expect(result.customerName).toBe("Consumidor Final");
    expect(result.items.length).toBe(2);
    expect(result.receiptText).toContain("HUG POS - FRENTE DE CAIXA");
    expect(result.receiptText).toContain("Amoxicilina 500mg");
    expect(result.receiptText).toContain("TROCO:");
    expect(result.receiptText).toContain("19,00");
  });

  it("garante idempotência retornando a mesma transação ao reutilizar a mesma chave", async () => {
    const supabase = createMockSupabase();

    const checkoutReq = {
      idempotencyKey: "sale-key-001", // mesma chave anterior
      terminalCode: "PDV-01",
      items: [{ productId: "prod-uuid-1", quantity: 1 }],
      payments: [{ method: "cash" as const, amount: 50.0 }],
    };

    // Deve retornar o mesmo objeto anterior do cache de idempotência sem reprocessar
    const duplicateResult = await executePdvCheckout(supabase, fakeSession, checkoutReq);
    expect(duplicateResult.subtotal).toBe(81.0); // Valor original da primeira transação com a mesma chave!
  });

  it("rejeita venda se o pagamento for insuficiente", async () => {
    const supabase = createMockSupabase();

    const checkoutReq = {
      idempotencyKey: "sale-key-insufficient",
      terminalCode: "PDV-01",
      items: [{ productId: "prod-uuid-1", quantity: 1 }], // Preço 35.50
      payments: [{ method: "cash" as const, amount: 20.0 }], // Falta 15.50
    };

    await expect(
      executePdvCheckout(supabase, fakeSession, checkoutReq)
    ).rejects.toThrow("Pagamento insuficiente");
  });
});
