import { describe, expect, it } from "vitest";
import { COMMERCE_SEGMENTS, getSegmentConfig, SEGMENT_CONFIGS } from "../src/lib/commerce/segments";
import {
  validateSegmentAttributes,
  normalizeProductWithLegacy,
  FoodServiceAttributesSchema,
  PharmacyAttributesSchema,
  GroceryAttributesSchema,
  FashionAttributesSchema,
  BeautyAttributesSchema,
  PetShopAttributesSchema,
  ElectronicsAttributesSchema,
  ConstructionAttributesSchema,
} from "../src/lib/commerce/attributes";

describe("BonaSoft Commerce - Arquitetura de Segmentos", () => {
  it("deve cobrir todos os 8 segmentos principais + varejo geral", () => {
    expect(COMMERCE_SEGMENTS).toContain("food_service");
    expect(COMMERCE_SEGMENTS).toContain("pharmacy");
    expect(COMMERCE_SEGMENTS).toContain("grocery");
    expect(COMMERCE_SEGMENTS).toContain("fashion");
    expect(COMMERCE_SEGMENTS).toContain("beauty");
    expect(COMMERCE_SEGMENTS).toContain("pet_shop");
    expect(COMMERCE_SEGMENTS).toContain("electronics");
    expect(COMMERCE_SEGMENTS).toContain("construction");
    expect(COMMERCE_SEGMENTS).toContain("general_retail");
    expect(COMMERCE_SEGMENTS.length).toBe(9);
  });

  it("deve fornecer vocabulário e termos adequados por segmento", () => {
    const pharma = getSegmentConfig("pharmacy");
    expect(pharma.terms.productLabel).toContain("Medicamento");
    expect(pharma.features.hasPrescriptionControl).toBe(true);
    expect(pharma.features.hasLotAndExpiration).toBe(true);

    const food = getSegmentConfig("food_service");
    expect(food.terms.catalogLabel).toBe("Cardápio");
    expect(food.features.hasTablesOrTabs).toBe(true);

    const fashion = getSegmentConfig("fashion");
    expect(fashion.terms.variationLabel).toContain("Grade");
    expect(fashion.features.hasGridVariants).toBe(true);

    const constr = getSegmentConfig("construction");
    expect(constr.features.hasTechnicalDeliveryFreight).toBe(true);
    expect(constr.features.hasWeightedMeasurement).toBe(true);
  });

  it("deve retornar fallback seguro para segmentos desconhecidos ou nulos", () => {
    const fallback = getSegmentConfig(null);
    expect(fallback.id).toBe("general_retail");
    expect(fallback.name).toContain("Varejo Geral");
  });
});

describe("BonaSoft Commerce - Validação Estrita de Atributos", () => {
  it("Farmácia: valida princípio ativo e controle de receita", () => {
    const result = validateSegmentAttributes("pharmacy", {
      active_ingredient: "Amoxicilina + Clavulanato",
      anvisa_registration: "100430001001",
      is_controlled: true,
      requires_prescription: true,
      prescription_type: "antimicrobial",
      dosage: "875mg + 125mg",
      manufacturer: "EMS",
      is_generic: true,
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect((result.data as any).is_generic).toBe(true);
      expect((result.data as any).prescription_type).toBe("antimicrobial");
    }
  });

  it("Mercado: valida unidade de medida e venda por peso", () => {
    const result = validateSegmentAttributes("grocery", {
      barcode_ean: "7891000100103",
      unit_of_measure: "KG",
      allow_fractional_sale: true,
      tare_weight_kg: 0.015,
      origin: "nacional",
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect((result.data as any).unit_of_measure).toBe("KG");
      expect((result.data as any).allow_fractional_sale).toBe(true);
    }
  });

  it("Moda: valida grade de tamanho e composição", () => {
    const result = validateSegmentAttributes("fashion", {
      size: "G",
      color: "Azul Marinho",
      color_hex: "#000080",
      gender: "masculino",
      collection: "Inverno 2026",
      fabric_composition: "100% Algodão Pima",
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect((result.data as any).size).toBe("G");
      expect((result.data as any).fabric_composition).toContain("Algodão");
    }
  });

  it("Eletrônicos: valida obrigatoriedade de serial/IMEI e voltagem", () => {
    const result = validateSegmentAttributes("electronics", {
      requires_serial_number: true,
      model_number: "SM-S928B",
      voltage: "bivolt",
      warranty_months: 12,
      anatel_homologation: "01234-24-05678",
      storage_capacity: "512GB",
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect((result.data as any).requires_serial_number).toBe(true);
      expect((result.data as any).warranty_months).toBe(12);
    }
  });

  it("Construção: valida unidade métrica e flag de frete pesado", () => {
    const result = validateSegmentAttributes("construction", {
      unit_of_sale: "M2",
      weight_kg_per_unit: 18.5,
      coverage_yield_m2: 1.0,
      heavy_freight: true,
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect((result.data as any).heavy_freight).toBe(true);
      expect((result.data as any).unit_of_sale).toBe("M2");
    }
  });

  it("Preserva retrocompatibilidade total com produtos legados de restaurantes", () => {
    const legacyProduct = {
      ingredients: ["Pão brioche", "Blend 180g", "Queijo cheddar", "Bacon crocante"],
      preparation_time_minutes: 25,
      segment_attributes: null,
    };

    const normalized = normalizeProductWithLegacy("food_service", legacyProduct);
    expect((normalized as any).ingredients).toHaveLength(4);
    expect((normalized as any).preparation_time_minutes).toBe(25);
    expect((normalized as any).allows_custom_notes).toBe(true);
  });
});
