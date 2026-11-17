/**
 * HUG (by BonaSoft) — Atributos Tipados por Segmento Comercial
 *
 * Cada segmento possui regras de validação estritas e atributos específicos de domínio.
 * Atributos não são gravados como JSONB sem validação: este arquivo garante
 * tipagem estrita com Zod e preserva total retrocompatibilidade com produtos já cadastrados.
 */

import { z } from "zod";
import { type CommerceSegment } from "./segments";

// =========================================================================
// 1. SCHEMAS DE ATRIBUTOS POR SEGMENTO
// =========================================================================

/** Gastronomia / Restaurantes / Lanchonetes */
export const FoodServiceAttributesSchema = z.object({
  ingredients: z.array(z.string()).default([]),
  preparation_time_minutes: z.number().int().min(0).nullable().default(null),
  serves_people: z.number().int().min(1).nullable().default(null),
  allows_custom_notes: z.boolean().default(true),
  allergens: z.array(z.string()).default([]),
  is_alcoholic: z.boolean().default(false),
});
export type FoodServiceAttributes = z.infer<typeof FoodServiceAttributesSchema>;

/** Farmácias e Drogarias */
export const PharmacyAttributesSchema = z.object({
  active_ingredient: z.string().min(1, "Princípio ativo é obrigatório para medicamentos").nullable().default(null),
  anvisa_registration: z.string().nullable().default(null),
  is_controlled: z.boolean().default(false),
  requires_prescription: z.boolean().default(false),
  prescription_type: z.enum(["none", "white", "blue", "yellow", "antimicrobial"]).default("none"),
  dosage: z.string().nullable().default(null), // ex: "500mg", "10mg/ml"
  manufacturer: z.string().nullable().default(null), // Laboratório
  is_generic: z.boolean().default(false),
  lot_number: z.string().nullable().default(null),
  expiration_date: z.string().nullable().default(null), // ISO date YYYY-MM-DD
  package_quantity: z.number().int().min(1).default(1),
});
export type PharmacyAttributes = z.infer<typeof PharmacyAttributesSchema>;

/** Mercados e Supermercados */
export const GroceryAttributesSchema = z.object({
  barcode_ean: z.string().nullable().default(null),
  unit_of_measure: z.enum(["UN", "KG", "G", "L", "ML", "CX", "PCT", "FD"]).default("UN"),
  allow_fractional_sale: z.boolean().default(false), // Venda pesada na balança
  tare_weight_kg: z.number().min(0).default(0),
  net_weight_kg: z.number().min(0).nullable().default(null),
  lot_number: z.string().nullable().default(null),
  expiration_date: z.string().nullable().default(null),
  origin: z.enum(["nacional", "importado"]).default("nacional"),
});
export type GroceryAttributes = z.infer<typeof GroceryAttributesSchema>;

/** Lojas de Roupas e Moda */
export const FashionAttributesSchema = z.object({
  size: z.string().nullable().default(null), // PP, P, M, G, GG, 38, 40, etc.
  color: z.string().nullable().default(null),
  color_hex: z.string().nullable().default(null),
  gender: z.enum(["unissex", "masculino", "feminino", "infantil", "bebe"]).default("unissex"),
  collection: z.string().nullable().default(null), // ex: "Verão 2026"
  fabric_composition: z.string().nullable().default(null), // ex: "100% Algodão"
  brand: z.string().nullable().default(null),
  grid_group_id: z.string().nullable().default(null), // Agrupador de variações da mesma peça
});
export type FashionAttributes = z.infer<typeof FashionAttributesSchema>;

/** Beleza, Barbearias e Estética */
export const BeautyAttributesSchema = z.object({
  service_duration_minutes: z.number().int().min(1).default(30),
  professional_required: z.boolean().default(true),
  suggested_return_days: z.number().int().min(0).nullable().default(null),
  products_used: z.array(z.string()).default([]),
  aftercare_instructions: z.string().nullable().default(null),
});
export type BeautyAttributes = z.infer<typeof BeautyAttributesSchema>;

/** Pet Shops e Agropecuárias */
export const PetShopAttributesSchema = z.object({
  target_species: z.enum(["cachorro", "gato", "aves", "roedores", "peixes", "bovinos", "equinos", "geral"]).default("geral"),
  pet_size: z.enum(["mini", "pequeno", "medio", "grande", "gigante", "todos"]).default("todos"),
  life_stage: z.enum(["filhote", "adulto", "senior", "todas"]).default("todas"),
  package_weight_kg: z.number().min(0).nullable().default(null),
  requires_veterinary_prescription: z.boolean().default(false),
  active_substance: z.string().nullable().default(null),
});
export type PetShopAttributes = z.infer<typeof PetShopAttributesSchema>;

/** Eletrônicos e Informática */
export const ElectronicsAttributesSchema = z.object({
  requires_serial_number: z.boolean().default(true), // Exige IMEI ou serial na venda
  model_number: z.string().nullable().default(null),
  voltage: z.enum(["bivolt", "110v", "220v", "nao_aplica"]).default("bivolt"),
  warranty_months: z.number().int().min(0).default(12),
  anatel_homologation: z.string().nullable().default(null),
  storage_capacity: z.string().nullable().default(null), // ex: "128GB", "1TB SSD"
  color: z.string().nullable().default(null),
});
export type ElectronicsAttributes = z.infer<typeof ElectronicsAttributesSchema>;

/** Materiais de Construção e Tintas */
export const ConstructionAttributesSchema = z.object({
  unit_of_sale: z.enum(["UN", "M2", "M3", "KG", "L", "BARRA", "SACO", "LATA", "PECA"]).default("UN"),
  weight_kg_per_unit: z.number().min(0).nullable().default(null), // Para cálculo de frete de carga pesada
  coverage_yield_m2: z.number().min(0).nullable().default(null), // Rendimento por lata/saco
  heavy_freight: z.boolean().default(false), // Exige caminhão/carga aberta
  dimensions_cm: z.object({
    length: z.number().min(0).nullable().default(null),
    width: z.number().min(0).nullable().default(null),
    height: z.number().min(0).nullable().default(null),
  }).default({ length: null, width: null, height: null }),
});
export type ConstructionAttributes = z.infer<typeof ConstructionAttributesSchema>;

/** Varejo Geral */
export const GeneralRetailAttributesSchema = z.object({
  barcode_ean: z.string().nullable().default(null),
  brand: z.string().nullable().default(null),
  model: z.string().nullable().default(null),
  unit_of_measure: z.string().default("UN"),
  warranty_days: z.number().int().min(0).default(90),
});
export type GeneralRetailAttributes = z.infer<typeof GeneralRetailAttributesSchema>;

// =========================================================================
// 2. DISCRIMINATED ATTRIBUTES & VALIDATION
// =========================================================================

export type SegmentAttributesMap = {
  food_service: FoodServiceAttributes;
  pharmacy: PharmacyAttributes;
  grocery: GroceryAttributes;
  fashion: FashionAttributes;
  beauty: BeautyAttributes;
  pet_shop: PetShopAttributes;
  electronics: ElectronicsAttributes;
  construction: ConstructionAttributes;
  general_retail: GeneralRetailAttributes;
};

export type AnySegmentAttributes = SegmentAttributesMap[CommerceSegment];

export const SCHEMAS_BY_SEGMENT: Record<CommerceSegment, z.ZodTypeAny> = {
  food_service: FoodServiceAttributesSchema,
  pharmacy: PharmacyAttributesSchema,
  grocery: GroceryAttributesSchema,
  fashion: FashionAttributesSchema,
  beauty: BeautyAttributesSchema,
  pet_shop: PetShopAttributesSchema,
  electronics: ElectronicsAttributesSchema,
  construction: ConstructionAttributesSchema,
  general_retail: GeneralRetailAttributesSchema,
};

/**
 * Valida e higieniza os atributos conforme as regras estritas do segmento.
 */
export function validateSegmentAttributes(
  segment: CommerceSegment,
  raw: unknown
): { valid: true; data: AnySegmentAttributes } | { valid: false; errors: string[] } {
  const schema = SCHEMAS_BY_SEGMENT[segment] || GeneralRetailAttributesSchema;
  const result = schema.safeParse(raw ?? {});
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const errors = result.error.errors.map((e) => `${e.path.join(".") || "campo"}: ${e.message}`);
  return { valid: false, errors };
}

/**
 * Normaliza os atributos garantindo compatibilidade com registros existentes
 * de produtos que já possuíam colunas 'ingredients' ou 'preparation_time_minutes'.
 */
export function normalizeProductWithLegacy(
  segment: CommerceSegment,
  product: {
    ingredients?: string[] | null;
    preparation_time_minutes?: number | null;
    segment_attributes?: unknown;
  }
): AnySegmentAttributes {
  const explicit = product.segment_attributes;

  if (segment === "food_service") {
    const raw = (explicit && typeof explicit === "object") ? explicit : {};
    return FoodServiceAttributesSchema.parse({
      ingredients: product.ingredients ?? (raw as any).ingredients ?? [],
      preparation_time_minutes: product.preparation_time_minutes ?? (raw as any).preparation_time_minutes ?? null,
      ...raw,
    });
  }

  const schema = SCHEMAS_BY_SEGMENT[segment] || GeneralRetailAttributesSchema;
  const parsed = schema.safeParse(explicit ?? {});
  if (parsed.success) return parsed.data;
  return schema.parse({});
}
