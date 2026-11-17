/**
 * BonaSoft Commerce — Núcleo de Lógica do Carrinho de Vendas (PDV)
 *
 * Gerencia inclusão de itens, atualização de quantidades (incluindo fracionadas para balança),
 * descontos por item, descontos globais, acréscimos e cálculo seguro de totais e troco.
 */

import { toCents, fromCents, multiplyMoney, subtractMoney, addMoney, calculateDiscount } from "./money";
import { type CommerceSegment } from "../segments";

export type PaymentMethod = "money" | "credit_card" | "debit_card" | "pix" | "transfer";

export interface CartItem {
  id: string; // ID do produto
  name: string;
  unitPrice: number;
  quantity: number; // Suporta decimal para itens pesáveis (ex: 1.450 kg de carne ou 2.5 m² de piso)
  unit: string; // UN, KG, M2, etc.
  segment: CommerceSegment;
  barcode?: string | null;
  sku?: string | null;
  discount: number; // Desconto específico no item
  notes?: string;
  itemTotal: number; // (unitPrice * quantity) - discount
}

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  receivedAmount?: number; // Para dinheiro, valor entregue pelo cliente
  changeAmount?: number; // Troco calculado
  transactionRef?: string;
}

export interface CartTotals {
  subtotal: number;
  itemsDiscount: number;
  generalDiscount: number;
  totalDiscount: number;
  increaseFee: number;
  total: number;
  totalPaid: number;
  remainingAmount: number;
  totalChange: number;
  isFullyPaid: boolean;
}

export class PdvCartManager {
  public items: CartItem[] = [];
  public generalDiscountValue: number = 0;
  public generalDiscountType: "fixed" | "percentage" = "fixed";
  public increaseFee: number = 0;
  public payments: PaymentSplit[] = [];

  constructor(items: CartItem[] = []) {
    this.items = items;
  }

  /**
   * Adiciona um produto ao carrinho ou incrementa sua quantidade caso já exista.
   */
  public addItem(product: {
    id: string;
    name: string;
    price: number;
    unit?: string;
    segment?: CommerceSegment;
    barcode?: string | null;
    sku?: string | null;
  }, quantity: number = 1): CartItem {
    const existingIndex = this.items.findIndex((item) => item.id === product.id);

    if (existingIndex >= 0) {
      const existing = this.items[existingIndex];
      const newQty = existing.quantity + quantity;
      return this.updateQuantity(existingIndex, newQty);
    }

    const itemTotal = multiplyMoney(product.price, quantity);
    const newItem: CartItem = {
      id: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      unit: product.unit || "UN",
      segment: product.segment || "food_service",
      barcode: product.barcode,
      sku: product.sku,
      discount: 0,
      itemTotal,
    };

    this.items.push(newItem);
    return newItem;
  }

  /**
   * Atualiza a quantidade de um item no carrinho.
   */
  public updateQuantity(index: number, quantity: number): CartItem {
    if (index < 0 || index >= this.items.length) {
      throw new Error("Item não encontrado no carrinho.");
    }
    if (quantity <= 0) {
      const removed = this.items.splice(index, 1)[0];
      return removed;
    }

    const item = this.items[index];
    item.quantity = quantity;
    const baseTotal = multiplyMoney(item.unitPrice, item.quantity);
    item.itemTotal = Math.max(0, subtractMoney(baseTotal, item.discount));
    return item;
  }

  /**
   * Remove um item do carrinho pelo índice.
   */
  public removeItem(index: number): boolean {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Aplica desconto a um item específico do carrinho.
   */
  public setItemDiscount(index: number, discountAmount: number): void {
    if (index < 0 || index >= this.items.length) return;
    const item = this.items[index];
    const baseTotal = multiplyMoney(item.unitPrice, item.quantity);
    item.discount = Math.min(baseTotal, Math.max(0, discountAmount));
    item.itemTotal = Math.max(0, subtractMoney(baseTotal, item.discount));
  }

  /**
   * Define o desconto geral da venda.
   */
  public setGeneralDiscount(value: number, type: "fixed" | "percentage" = "fixed"): void {
    this.generalDiscountValue = Math.max(0, value);
    this.generalDiscountType = type;
  }

  /**
   * Adiciona um pagamento ou parcelamento/divisão de pagamento.
   */
  public addPayment(payment: PaymentSplit): void {
    if (payment.amount <= 0) return;

    if (payment.method === "money" && payment.receivedAmount !== undefined) {
      const receivedCents = toCents(payment.receivedAmount);
      const amountCents = toCents(payment.amount);
      const changeCents = Math.max(0, receivedCents - amountCents);
      payment.changeAmount = fromCents(changeCents);
    } else {
      payment.changeAmount = 0;
    }

    this.payments.push(payment);
  }

  /**
   * Remove um meio de pagamento adicionado.
   */
  public removePayment(index: number): void {
    if (index >= 0 && index < this.payments.length) {
      this.payments.splice(index, 1);
    }
  }

  /**
   * Limpa todos os pagamentos lançados.
   */
  public clearPayments(): void {
    this.payments = [];
  }

  /**
   * Limpa o carrinho inteiro para uma nova venda.
   */
  public clearCart(): void {
    this.items = [];
    this.generalDiscountValue = 0;
    this.increaseFee = 0;
    this.payments = [];
  }

  /**
   * Calcula todos os subtotais, descontos, totais e status de liquidação.
   */
  public calculateTotals(): CartTotals {
    // 1. Subtotal bruto dos itens (preço unitário * quantidade)
    const rawSubtotalCents = this.items.reduce<number>((acc, item) => {
      return acc + toCents(multiplyMoney(item.unitPrice, item.quantity));
    }, 0);

    // 2. Soma dos descontos por item
    const itemsDiscountCents = this.items.reduce<number>((acc, item) => {
      return acc + toCents(item.discount);
    }, 0);

    const subtotalAfterItemDiscounts = Math.max(0, rawSubtotalCents - itemsDiscountCents);

    // 3. Desconto geral sobre o saldo restante
    const generalDiscountVal = calculateDiscount(
      fromCents(subtotalAfterItemDiscounts),
      this.generalDiscountValue,
      this.generalDiscountType
    );
    const generalDiscountCents = toCents(generalDiscountVal);

    // 4. Acréscimos/taxas
    const increaseFeeCents = toCents(this.increaseFee);

    // 5. Total líquido final da venda
    const totalCents = Math.max(0, subtotalAfterItemDiscounts - generalDiscountCents + increaseFeeCents);

    // 6. Total pago acumulado
    const totalPaidCents = this.payments.reduce<number>((acc, p) => acc + toCents(p.amount), 0);

    // 7. Saldo restante a pagar
    const remainingCents = Math.max(0, totalCents - totalPaidCents);

    // 8. Troco total gerado nos pagamentos em dinheiro
    const totalChangeCents = this.payments.reduce<number>((acc, p) => acc + toCents(p.changeAmount), 0);

    return {
      subtotal: fromCents(rawSubtotalCents),
      itemsDiscount: fromCents(itemsDiscountCents),
      generalDiscount: fromCents(generalDiscountCents),
      totalDiscount: fromCents(itemsDiscountCents + generalDiscountCents),
      increaseFee: fromCents(increaseFeeCents),
      total: fromCents(totalCents),
      totalPaid: fromCents(totalPaidCents),
      remainingAmount: fromCents(remainingCents),
      totalChange: fromCents(totalChangeCents),
      isFullyPaid: totalCents > 0 && totalPaidCents >= totalCents,
    };
  }
}
