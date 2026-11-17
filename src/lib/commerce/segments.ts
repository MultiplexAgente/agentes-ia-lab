/**
 * BonaSoft Commerce — Camada de Segmentos Comerciais
 *
 * Define os segmentos de mercado atendidos pela plataforma ERP SaaS,
 * seus termos vocabulários de domínio e ícones semânticos de negócio.
 * (NUNCA utilizar ícones de faísca/estrelas/IA).
 */

export const COMMERCE_SEGMENTS = [
  "food_service", // Restaurantes, bares, lanchonetes, pizzarias, cafeterias
  "pharmacy",     // Farmácias e drogarias
  "grocery",      // Mercados, supermercados, hortifrutis, mercearias
  "fashion",      // Lojas de roupas, calçados e moda
  "beauty",       // Salões de beleza, barbearias, clínicas de estética
  "pet_shop",     // Pet shops, clínicas veterinárias, agropecuárias
  "electronics",  // Lojas de eletrônicos, celulares, informática
  "construction", // Materiais de construção, tintas, acabamentos
  "general_retail"// Varejo geral e outras lojas
] as const;

export type CommerceSegment = (typeof COMMERCE_SEGMENTS)[number];

export interface SegmentConfig {
  id: CommerceSegment;
  name: string;
  shortLabel: string;
  description: string;
  /** Ícone semântico de negócio (nome de componente Lucide) */
  iconName: string;
  terms: {
    productLabel: string;
    productPlural: string;
    orderLabel: string;
    orderPlural: string;
    categoryLabel: string;
    catalogLabel: string;
    variationLabel: string;
  };
  features: {
    hasTablesOrTabs: boolean;          // Comandas e mesas (restaurantes)
    hasLotAndExpiration: boolean;       // Lote e validade (farmácias, mercados)
    hasPrescriptionControl: boolean;    // Retenção de receita (farmácias, pet)
    hasGridVariants: boolean;           // Grade cor/tamanho (moda)
    hasSerialOrImei: boolean;           // Serial/IMEI rastreável (eletrônicos)
    hasWeightedMeasurement: boolean;    // Venda fracionada/peso (mercados, construção)
    hasAppointmentBooking: boolean;     // Agendamento de horários (beleza, estética)
    hasTechnicalDeliveryFreight: boolean;// Frete pesado / entrega técnica (construção)
  };
  defaultUnit: string;
}

export const SEGMENT_CONFIGS: Record<CommerceSegment, SegmentConfig> = {
  food_service: {
    id: "food_service",
    name: "Restaurantes, Bares e Gastronomia",
    shortLabel: "Gastronomia",
    description: "Para restaurantes, hamburguerias, lanchonetes, pizzarias, delivery e cafeterias.",
    iconName: "UtensilsCrossed",
    terms: {
      productLabel: "Item / Prato",
      productPlural: "Cardápio e Pratos",
      orderLabel: "Pedido / Comanda",
      orderPlural: "Pedidos e Comandas",
      categoryLabel: "Seção do Cardápio",
      catalogLabel: "Cardápio",
      variationLabel: "Adicional / Complemento",
    },
    features: {
      hasTablesOrTabs: true,
      hasLotAndExpiration: false,
      hasPrescriptionControl: false,
      hasGridVariants: false,
      hasSerialOrImei: false,
      hasWeightedMeasurement: false,
      hasAppointmentBooking: false,
      hasTechnicalDeliveryFreight: false,
    },
    defaultUnit: "UN",
  },
  pharmacy: {
    id: "pharmacy",
    name: "Farmácias e Drogarias",
    shortLabel: "Farmácia",
    description: "Para farmácias, drogarias e manipulação com controle de lotes, genéricos e receitas.",
    iconName: "Pill",
    terms: {
      productLabel: "Medicamento / Produto",
      productPlural: "Medicamentos",
      orderLabel: "Venda / Pedido",
      orderPlural: "Vendas",
      categoryLabel: "Classe Terapêutica / Categoria",
      catalogLabel: "Lista de Medicamentos",
      variationLabel: "Apresentação / Dosagem",
    },
    features: {
      hasTablesOrTabs: false,
      hasLotAndExpiration: true,
      hasPrescriptionControl: true,
      hasGridVariants: false,
      hasSerialOrImei: false,
      hasWeightedMeasurement: false,
      hasAppointmentBooking: false,
      hasTechnicalDeliveryFreight: false,
    },
    defaultUnit: "CX",
  },
  grocery: {
    id: "grocery",
    name: "Mercados e Supermercados",
    shortLabel: "Mercado",
    description: "Para mercearias, supermercados, minimercados e hortifrutis com código de barras e venda por peso.",
    iconName: "ShoppingCart",
    terms: {
      productLabel: "Produto / Mercadoria",
      productPlural: "Produtos",
      orderLabel: "Compra / Pedido",
      orderPlural: "Vendas de Caixa",
      categoryLabel: "Departamento / Setor",
      catalogLabel: "Mix de Produtos",
      variationLabel: "Embalagem / Volume",
    },
    features: {
      hasTablesOrTabs: false,
      hasLotAndExpiration: true,
      hasPrescriptionControl: false,
      hasGridVariants: false,
      hasSerialOrImei: false,
      hasWeightedMeasurement: true,
      hasAppointmentBooking: false,
      hasTechnicalDeliveryFreight: false,
    },
    defaultUnit: "UN",
  },
  fashion: {
    id: "fashion",
    name: "Lojas de Roupas e Moda",
    shortLabel: "Moda & Vestuário",
    description: "Para lojas de roupas, calçados, moda íntima e acessórios com grade de tamanhos e cores.",
    iconName: "Shirt",
    terms: {
      productLabel: "Peça / Modelo",
      productPlural: "Peças / Coleção",
      orderLabel: "Venda / Atendimento",
      orderPlural: "Vendas",
      categoryLabel: "Departamento / Coleção",
      catalogLabel: "Catálogo de Coleção",
      variationLabel: "Grade (Cor / Tamanho)",
    },
    features: {
      hasTablesOrTabs: false,
      hasLotAndExpiration: false,
      hasPrescriptionControl: false,
      hasGridVariants: true,
      hasSerialOrImei: false,
      hasWeightedMeasurement: false,
      hasAppointmentBooking: false,
      hasTechnicalDeliveryFreight: false,
    },
    defaultUnit: "PEÇA",
  },
  beauty: {
    id: "beauty",
    name: "Beleza, Barbearias e Estética",
    shortLabel: "Beleza & Estética",
    description: "Para salões de beleza, barbearias, spas e clínicas com agenda e venda de cosméticos.",
    iconName: "Scissors",
    terms: {
      productLabel: "Serviço / Cosmético",
      productPlural: "Serviços e Produtos",
      orderLabel: "Atendimento / Sessão",
      orderPlural: "Atendimentos",
      categoryLabel: "Tipo de Atendimento",
      catalogLabel: "Menu de Serviços",
      variationLabel: "Duração / Nível",
    },
    features: {
      hasTablesOrTabs: false,
      hasLotAndExpiration: false,
      hasPrescriptionControl: false,
      hasGridVariants: false,
      hasSerialOrImei: false,
      hasWeightedMeasurement: false,
      hasAppointmentBooking: true,
      hasTechnicalDeliveryFreight: false,
    },
    defaultUnit: "SERV",
  },
  pet_shop: {
    id: "pet_shop",
    name: "Pet Shops e Agropecuárias",
    shortLabel: "Pet Shop",
    description: "Para pet shops, banho & tosa, rações por peso e consultórios veterinários.",
    iconName: "PawPrint",
    terms: {
      productLabel: "Produto / Atendimento Pet",
      productPlural: "Produtos e Serviços Pet",
      orderLabel: "Pedido / Atendimento",
      orderPlural: "Atendimentos & Vendas",
      categoryLabel: "Espécie / Linha",
      catalogLabel: "Catálogo Pet",
      variationLabel: "Porte / Peso da Embalagem",
    },
    features: {
      hasTablesOrTabs: false,
      hasLotAndExpiration: true,
      hasPrescriptionControl: true,
      hasGridVariants: false,
      hasSerialOrImei: false,
      hasWeightedMeasurement: true,
      hasAppointmentBooking: true,
      hasTechnicalDeliveryFreight: false,
    },
    defaultUnit: "UN",
  },
  electronics: {
    id: "electronics",
    name: "Eletrônicos e Informática",
    shortLabel: "Eletrônicos",
    description: "Para lojas de tecnologia, smartphones, informática e acessórios com rastreio de serial/IMEI.",
    iconName: "Cpu",
    terms: {
      productLabel: "Dispositivo / Acessório",
      productPlural: "Aparelhos e Acessórios",
      orderLabel: "Venda / Pedido",
      orderPlural: "Vendas",
      categoryLabel: "Categoria / Linha",
      catalogLabel: "Catálogo Técnico",
      variationLabel: "Capacidade / Cor / Voltagem",
    },
    features: {
      hasTablesOrTabs: false,
      hasLotAndExpiration: false,
      hasPrescriptionControl: false,
      hasGridVariants: true,
      hasSerialOrImei: true,
      hasWeightedMeasurement: false,
      hasAppointmentBooking: false,
      hasTechnicalDeliveryFreight: false,
    },
    defaultUnit: "UN",
  },
  construction: {
    id: "construction",
    name: "Materiais de Construção e Tintas",
    shortLabel: "Materiais de Construção",
    description: "Para lojas de material básico, elétrico, hidráulico, tintas e acabamentos com frete pesado.",
    iconName: "Hammer",
    terms: {
      productLabel: "Material / Item",
      productPlural: "Materiais e Ferramentas",
      orderLabel: "Orçamento / Pedido",
      orderPlural: "Orçamentos e Cargas",
      categoryLabel: "Fase da Obra / Setor",
      catalogLabel: "Tabela de Materiais",
      variationLabel: "Medida / Rendimento / Bitola",
    },
    features: {
      hasTablesOrTabs: false,
      hasLotAndExpiration: true,
      hasPrescriptionControl: false,
      hasGridVariants: false,
      hasSerialOrImei: false,
      hasWeightedMeasurement: true,
      hasAppointmentBooking: false,
      hasTechnicalDeliveryFreight: true,
    },
    defaultUnit: "UN",
  },
  general_retail: {
    id: "general_retail",
    name: "Comércio e Varejo Geral",
    shortLabel: "Varejo Geral",
    description: "Para papelarias, lojas de presentes, utilidades, bazares e estabelecimentos comerciais diversos.",
    iconName: "Boxes",
    terms: {
      productLabel: "Produto / Item",
      productPlural: "Produtos",
      orderLabel: "Venda / Pedido",
      orderPlural: "Vendas",
      categoryLabel: "Categoria",
      catalogLabel: "Catálogo",
      variationLabel: "Variação",
    },
    features: {
      hasTablesOrTabs: false,
      hasLotAndExpiration: false,
      hasPrescriptionControl: false,
      hasGridVariants: true,
      hasSerialOrImei: false,
      hasWeightedMeasurement: false,
      hasAppointmentBooking: false,
      hasTechnicalDeliveryFreight: false,
    },
    defaultUnit: "UN",
  },
};

export function getSegmentConfig(segment?: string | null): SegmentConfig {
  if (segment && segment in SEGMENT_CONFIGS) {
    return SEGMENT_CONFIGS[segment as CommerceSegment];
  }
  return SEGMENT_CONFIGS.general_retail;
}
