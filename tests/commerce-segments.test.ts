import { describe, expect, it } from "vitest";
import { COMMERCE_SEGMENTS, getSegmentConfig } from "../src/lib/commerce/segments";
import {
  validateSegmentAttributes,
  normalizeProductWithLegacy,
} from "../src/lib/commerce/attributes";
import {
  sanitizeSegmentSettings,
  saveCompanySegmentSettings,
  DEFAULT_SEGMENT_SETTINGS,
} from "../src/lib/commerce/company-segments";
import { buildTools } from "../src/lib/multiplex/tools.server";

describe("HUG (by BonaSoft) - Arquitetura de Segmentos", () => {
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

describe("HUG (by BonaSoft) - Validação Estrita de Atributos", () => {
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

describe("HUG (by BonaSoft) - Múltiplos Segmentos por Empresa & Permissões", () => {
  it("permite que uma mesma empresa opere múltiplos segmentos ativos simultaneamente", () => {
    // Exemplo: Supermercado que também possui Padaria (food_service) e Farmácia (pharmacy)
    const settings = sanitizeSegmentSettings({
      primarySegment: "grocery",
      secondarySegments: ["food_service", "pharmacy"],
    });

    expect(settings.primarySegment).toBe("grocery");
    expect(settings.secondarySegments).toEqual(["food_service", "pharmacy"]);
    expect(settings.activeSegments).toEqual(["grocery", "food_service", "pharmacy"]);

    // As capacidades devem agregar as funcionalidades de todos os segmentos ativos
    expect(settings.capabilities.hasWeightedMeasurement).toBe(true); // do supermercado
    expect(settings.capabilities.hasTablesOrTabs).toBe(true);        // da lanchonete/padaria
    expect(settings.capabilities.hasPrescriptionControl).toBe(true); // da farmácia
  });

  it("bloqueia alteração de segmentos por usuários sem privilégio de admin ou owner", async () => {
    const mockSupabase = {} as any;
    const settings = DEFAULT_SEGMENT_SETTINGS;

    const operatorAttempt = await saveCompanySegmentSettings(
      mockSupabase,
      "company-123",
      "operator",
      settings
    );
    expect(operatorAttempt.ok).toBe(false);
    expect(operatorAttempt.error).toContain("proprietários e administradores");

    const cashierAttempt = await saveCompanySegmentSettings(
      mockSupabase,
      "company-123",
      "cashier",
      settings
    );
    expect(cashierAttempt.ok).toBe(false);
  });
});

describe("HUG (by BonaSoft) - Ferramenta de Código de Barras (lookup_barcode)", () => {
  it("registra a ferramenta lookup_barcode no motor de ferramentas do Multiplex", () => {
    const fakeContext = {
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              or: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any,
      companyId: "comp-123",
      scope: "authenticated" as const,
      calls: [],
    };

    const tools = buildTools(fakeContext);
    expect(tools).toHaveProperty("lookup_barcode");
    expect(tools).toHaveProperty("search_products");
    expect(tools).toHaveProperty("get_product");
  });

  it("lookup_barcode responde com mensagem anti-alucinação quando produto não existe", async () => {
    const fakeContext = {
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              or: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      } as any,
      companyId: "comp-123",
      scope: "authenticated" as const,
      calls: [],
    };

    const tools = buildTools(fakeContext);
    const result = await tools.lookup_barcode.execute({ barcode: "7899999999999" });

    expect(result).toHaveProperty("found", false);
    expect(result.message).toContain("não encontrado no catálogo desta empresa");
    expect(result.message).toContain("Não invente dados do produto");
  });

  it("lookup_barcode rejeita códigos inválidos ou vazios", async () => {
    const fakeContext = {
      supabase: {} as any,
      companyId: "comp-123",
      scope: "authenticated" as const,
      calls: [],
    };

    const tools = buildTools(fakeContext);
    const result = await tools.lookup_barcode.execute({ barcode: "   " });
    expect(result).toHaveProperty("error");
  });

  it("lookup_barcode retorna produto real formatado quando o código existe no catálogo da empresa", async () => {
    const fakeContext = {
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              or: () => ({
                limit: () => ({
                  maybeSingle: async () => ({
                    data: {
                      id: "prod-456",
                      name: "Dipirona Monoidratada 500mg 10 comprimidos",
                      description: "Analgésico e antitérmico",
                      price: 8.5,
                      available: true,
                      current_stock: 42,
                      unit_of_measure: "CX",
                      barcode_ean: "7891000315507",
                      product_categories: { name: "Medicamentos" },
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      } as any,
      companyId: "comp-123",
      scope: "authenticated" as const,
      calls: [],
    };

    const tools = buildTools(fakeContext);
    const result = await tools.lookup_barcode.execute({ barcode: "7891000315507" });

    expect(result).toHaveProperty("found", true);
    expect(result.product.name).toContain("Dipirona Monoidratada");
    expect(result.product.price).toBe(8.5);
    expect(result.product.price_formatted).toContain("8,50");
    expect(result.product.current_stock).toBe(42);
    expect(result.product.unit_of_measure).toBe("CX");
  });
});
