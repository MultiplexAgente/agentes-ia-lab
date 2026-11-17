/**
 * VENDRA POS (by BonaSoft) — Gestão de Sessões de Caixa e Movimentações (PDV)
 *
 * Implementa abertura de caixa, saldo inicial, sangrias (retiradas),
 * suprimentos (reforços), fechamento com totalização por meio de pagamento
 * e cálculo preciso de divergência de caixa.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { toCents, fromCents, addMoney, subtractMoney } from "./money";

export type CashSessionStatus = "OPEN" | "CLOSED";
export type CashMovementType = "SUPRIMENTO" | "SANGRIA";

export interface CashMovement {
  id: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  operatorEmail: string;
  createdAt: string;
}

export interface CashSession {
  id: string;
  companyId: string;
  terminalCode: string;
  operatorId: string;
  operatorEmail: string;
  openedAt: string;
  closedAt?: string | null;
  initialCashAmount: number;
  status: CashSessionStatus;
  movements: CashMovement[];
  salesSummary?: {
    cashTotal: number;
    creditCardTotal: number;
    debitCardTotal: number;
    pixTotal: number;
    salesCount: number;
  };
  closingReport?: {
    countedCash: number;
    expectedCash: number;
    divergence: number; // Positivo = sobra, Negativo = falta
    notes?: string;
  };
}

// In-memory fallback para sessões ativas do PDV
const activeSessionsCache = new Map<string, CashSession>(); // key: companyId:terminalCode

export class CashRegisterService {
  /**
   * Obtém a sessão ativa de um terminal de caixa da empresa.
   */
  public static async getActiveSession(
    supabase: SupabaseClient,
    companyId: string,
    terminalCode: string = "CAIXA-01"
  ): Promise<CashSession | null> {
    const cacheKey = `${companyId}:${terminalCode}`;
    const cached = activeSessionsCache.get(cacheKey);
    if (cached && cached.status === "OPEN") {
      return cached;
    }

    try {
      const { data } = await supabase
        .from("cash_sessions")
        .select("*")
        .eq("company_id", companyId)
        .eq("terminal_code", terminalCode)
        .eq("status", "OPEN")
        .order("opened_at", { ascending: false })
        .maybeSingle();

      if (data) {
        const session: CashSession = {
          id: data.id,
          companyId: data.company_id,
          terminalCode: data.terminal_code,
          operatorId: data.operator_id,
          operatorEmail: data.operator_email,
          openedAt: data.opened_at,
          initialCashAmount: Number(data.initial_cash_amount ?? 0),
          status: "OPEN",
          movements: data.movements ?? [],
          salesSummary: data.sales_summary ?? {
            cashTotal: 0,
            creditCardTotal: 0,
            debitCardTotal: 0,
            pixTotal: 0,
            salesCount: 0,
          },
        };
        activeSessionsCache.set(cacheKey, session);
        return session;
      }
    } catch {
      // Tabela pode ainda ser puramente documental
    }

    return null;
  }

  /**
   * Abre uma nova sessão de caixa com saldo inicial de troco.
   */
  public static async openSession(
    supabase: SupabaseClient,
    params: {
      companyId: string;
      terminalCode?: string;
      operatorId: string;
      operatorEmail: string;
      initialCashAmount: number;
    }
  ): Promise<CashSession> {
    const terminalCode = params.terminalCode || "CAIXA-01";
    const cacheKey = `${params.companyId}:${terminalCode}`;

    const existing = await this.getActiveSession(supabase, params.companyId, terminalCode);
    if (existing) {
      throw new Error(`O terminal ${terminalCode} já possui um caixa aberto pelo operador ${existing.operatorEmail}.`);
    }

    const sessionId = `cash_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const session: CashSession = {
      id: sessionId,
      companyId: params.companyId,
      terminalCode,
      operatorId: params.operatorId,
      operatorEmail: params.operatorEmail,
      openedAt: new Date().toISOString(),
      initialCashAmount: Math.max(0, fromCents(toCents(params.initialCashAmount))),
      status: "OPEN",
      movements: [],
      salesSummary: {
        cashTotal: 0,
        creditCardTotal: 0,
        debitCardTotal: 0,
        pixTotal: 0,
        salesCount: 0,
      },
    };

    activeSessionsCache.set(cacheKey, session);

    try {
      await supabase.from("cash_sessions").insert({
        id: session.id,
        company_id: session.companyId,
        terminal_code: session.terminalCode,
        operator_id: session.operatorId,
        operator_email: session.operatorEmail,
        opened_at: session.openedAt,
        initial_cash_amount: session.initialCashAmount,
        status: "OPEN",
        movements: [],
      });
    } catch {
      // Fallback
    }

    return session;
  }

  /**
   * Registra uma movimentação de caixa (suprimento ou sangria).
   */
  public static async registerMovement(
    supabase: SupabaseClient,
    params: {
      companyId: string;
      terminalCode?: string;
      type: CashMovementType;
      amount: number;
      reason: string;
      operatorEmail: string;
    }
  ): Promise<CashMovement> {
    const terminalCode = params.terminalCode || "CAIXA-01";
    const session = await this.getActiveSession(supabase, params.companyId, terminalCode);
    if (!session) {
      throw new Error("Não há caixa aberto neste terminal para registrar movimentações.");
    }

    const amount = Math.max(0, fromCents(toCents(params.amount)));
    if (amount <= 0) {
      throw new Error("O valor da movimentação deve ser maior que zero.");
    }
    if (!params.reason.trim()) {
      throw new Error("Informe a justificativa da movimentação.");
    }

    const movement: CashMovement = {
      id: `mov_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: params.type,
      amount,
      reason: params.reason.trim(),
      operatorEmail: params.operatorEmail,
      createdAt: new Date().toISOString(),
    };

    session.movements.push(movement);
    const cacheKey = `${params.companyId}:${terminalCode}`;
    activeSessionsCache.set(cacheKey, session);

    return movement;
  }

  /**
   * Atualiza os totais de vendas da sessão de caixa ativa.
   */
  public static recordSaleInSession(
    companyId: string,
    terminalCode: string = "CAIXA-01",
    payments: Array<{ method: string; amount: number }>
  ): void {
    const cacheKey = `${companyId}:${terminalCode}`;
    const session = activeSessionsCache.get(cacheKey);
    if (!session || session.status !== "OPEN") return;

    if (!session.salesSummary) {
      session.salesSummary = { cashTotal: 0, creditCardTotal: 0, debitCardTotal: 0, pixTotal: 0, salesCount: 0 };
    }

    for (const p of payments) {
      if (p.method === "money" || p.method === "cash") {
        session.salesSummary.cashTotal = addMoney(session.salesSummary.cashTotal, p.amount);
      } else if (p.method === "credit_card") {
        session.salesSummary.creditCardTotal = addMoney(session.salesSummary.creditCardTotal, p.amount);
      } else if (p.method === "debit_card") {
        session.salesSummary.debitCardTotal = addMoney(session.salesSummary.debitCardTotal, p.amount);
      } else if (p.method === "pix") {
        session.salesSummary.pixTotal = addMoney(session.salesSummary.pixTotal, p.amount);
      }
    }
    session.salesSummary.salesCount += 1;
  }

  /**
   * Realiza o fechamento de caixa, totalizando os valores e calculando divergências.
   */
  public static async closeSession(
    supabase: SupabaseClient,
    params: {
      companyId: string;
      terminalCode?: string;
      countedCash: number;
      notes?: string;
    }
  ): Promise<CashSession> {
    const terminalCode = params.terminalCode || "CAIXA-01";
    const cacheKey = `${params.companyId}:${terminalCode}`;
    const session = await this.getActiveSession(supabase, params.companyId, terminalCode);
    if (!session) {
      throw new Error("Nenhum caixa aberto neste terminal.");
    }

    // Calcula total esperado em dinheiro:
    // Saldo inicial + Vendas em dinheiro + Suprimentos - Sangrias
    const suprimentosCents = session.movements
      .filter((m) => m.type === "SUPRIMENTO")
      .reduce((sum, m) => sum + toCents(m.amount), 0);

    const sangriasCents = session.movements
      .filter((m) => m.type === "SANGRIA")
      .reduce((sum, m) => sum + toCents(m.amount), 0);

    const initialCents = toCents(session.initialCashAmount);
    const cashSalesCents = toCents(session.salesSummary?.cashTotal ?? 0);

    const expectedCashCents = initialCents + cashSalesCents + suprimentosCents - sangriasCents;
    const countedCashCents = toCents(params.countedCash);
    const divergenceCents = countedCashCents - expectedCashCents;

    session.status = "CLOSED";
    session.closedAt = new Date().toISOString();
    session.closingReport = {
      countedCash: fromCents(countedCashCents),
      expectedCash: fromCents(expectedCashCents),
      divergence: fromCents(divergenceCents),
      notes: params.notes,
    };

    activeSessionsCache.delete(cacheKey);

    return session;
  }
}
