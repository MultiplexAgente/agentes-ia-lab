/**
 * VENDRA (by BonaSoft) — Contratos de Integração: Vendra ERP <-> Multiplex AI Engine (Vendra AI)
 *
 * Formaliza a comunicação desacoplada entre a plataforma SaaS comercial VENDRA
 * e o motor central de inteligência artificial Multiplex.
 *
 * A IA nunca altera o banco de dados diretamente sem passar pela camada de
 * autorização e validação de regras de negócio do ERP.
 */

import { type CommerceSegment } from "./segments";
import { type AnySegmentAttributes } from "./attributes";

export type UserRole = "owner" | "admin" | "manager" | "cashier" | "salesperson" | "attendant";

export type CommerceChannel = "web_portal" | "whatsapp" | "instagram" | "facebook" | "telegram" | "pdv_counter";

export interface TenantCommerceContext {
  companyId: string;
  companyName: string;
  segment: CommerceSegment;
  activePlan: string;
  defaultCurrency: string; // "BRL"
  businessHours: {
    isOpenNow: boolean;
    nextOpenAt?: string | null;
  };
  commercialPolicies: {
    maxDiscountPercent: number;
    allowOrderWithoutStock: boolean;
    deliveryFeeModel: "fixed" | "distance" | "neighborhood" | "free";
  };
}

export interface OperatorContext {
  userId: string;
  email: string;
  role: UserRole;
  displayName: string;
}

export interface CommercialProductItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  unit: string;
  barcode_ean?: string | null;
  segment: CommerceSegment;
  attributes: AnySegmentAttributes;
}

export interface CommercialCustomerItem {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document?: string | null; // CPF / CNPJ
  totalOrders: number;
  lifetimeValue: number;
}

export interface CommercialOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  notes?: string | null;
}

export interface CommercialOrderDraft {
  customerId: string;
  items: CommercialOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string | null;
  channel: CommerceChannel;
  notes: string | null;
}

/**
 * Contrato de chamada ao Multiplex AI Engine (Vendra AI) pelo Vendra ERP
 */
export interface MultiplexExecutionRequest {
  tenant: TenantCommerceContext;
  operator?: OperatorContext | null; // Nulo se for chat público de cliente
  channel: CommerceChannel;
  conversationId: string;
  messageText: string;
  clientContext?: {
    customerPhone?: string | null;
    customerExternalId?: string | null;
  };
  preferredModelAlias?: "gpt" | "claude" | "deepseek";
}

/**
 * Contrato de retorno do Multiplex AI Engine (Vendra AI) para o Vendra ERP
 */
export interface MultiplexExecutionResponse {
  conversationId: string;
  responseText: string;
  suggestedAction?: {
    type: "create_order" | "show_products" | "request_human_handoff" | "update_customer";
    payload: Record<string, unknown>;
  } | null;
  telemetry: {
    modelAlias: string;
    actualModelId: string;
    provider: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
    latencyMs: number;
    finishReason: string;
  };
}
