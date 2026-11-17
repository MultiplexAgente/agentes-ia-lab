import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Barcode,
  Boxes,
  Building2,
  Check,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  Globe,
  Layers,
  LineChart,
  Lock,
  MessageSquare,
  Package,
  Play,
  Receipt,
  Scan,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  Pill,
  Scissors,
  Wrench,
  Dog,
  Laptop,
  CheckCircle2,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Bell,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VENDRA | Seu negócio merece uma gestão extraordinária" },
      {
        name: "description",
        content:
          "Plataforma completa de gestão empresarial, frente de caixa ágil (PDV), estoque multissegmento e inteligência artificial unificada. by BonaSoft.",
      },
      { property: "og:title", content: "VENDRA | Seu negócio merece uma gestão extraordinária" },
      {
        property: "og:description",
        content:
          "VENDRA by BonaSoft — Gestão comercial, vendas, estoque, financeiro e inteligência artificial em uma única plataforma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

// Os 5 Produtos Vendra do Ecossistema
const ECOSYSTEM_PRODUCTS = [
  {
    id: "erp",
    name: "Vendra ERP",
    category: "Gestão Empresarial Centralizada",
    tagline: "O núcleo operacional e financeiro da sua empresa",
    description:
      "Controle completo de compras, estoques múltiplos, contas a pagar e receber, fluxo de caixa e relatórios gerenciais consolidados em tempo real.",
    highlights: [
      "Visão consolidada de matriz e filiais em tempo real",
      "Fluxo de caixa diário com conciliação automática",
      "Gestão de compras calculada pelo giro de estoque",
      "Cadastros unificados de parceiros, clientes e itens",
    ],
    metricLabel: "Visibilidade Financeira",
    metricValue: "Tempo Real",
    statNumber: "€ 48.250",
    statDesc: "Consolidado hoje nas filiais",
  },
  {
    id: "pos",
    name: "Vendra POS",
    category: "Frente de Caixa Ágil",
    tagline: "Velocidade instantânea no momento da venda",
    description:
      "Frente de caixa ágil e resiliente para balcão, teclado, tela touchscreen e leitor de código de barras. Suporta pesáveis de balança e divisão de pagamentos.",
    highlights: [
      "Leitura de código de barras EAN-13 em menos de 20ms",
      "Operação com pesáveis e venda fracionada por balança",
      "Abertura, sangria, suprimento e fechamento seguro de caixa",
      "Múltiplas formas de pagamento no mesmo cupom fiscal",
    ],
    metricLabel: "Velocidade no Checkout",
    metricValue: "18ms",
    statNumber: "184 pedidos",
    statDesc: "Processados sem fila de espera",
  },
  {
    id: "mobile",
    name: "Vendra Mobile",
    category: "Gestão na Palma da Mão",
    tagline: "Acompanhe sua empresa de qualquer lugar",
    description:
      "Aplicativo nativo para gestores consultarem indicadores em tempo real, aprovarem ordens de compra e receberem alertas críticos de ruptura de estoque.",
    highlights: [
      "Dashboard executivo em smartphones iOS e Android",
      "Notificações instantâneas de metas e fechamento de caixa",
      "Consulta ágil de estoque e preços em trânsito",
      "Aprovações gerenciais remotas com um toque",
    ],
    metricLabel: "Disponibilidade",
    metricValue: "iOS & Android",
    statNumber: "100%",
    statDesc: "Operações sincronizadas na nuvem",
  },
  {
    id: "store",
    name: "Vendra Store",
    category: "Comércio Digital Integrado",
    tagline: "Suas vendas físicas e digitais sincronizadas",
    description:
      "Catálogo digital e canal de vendas online conectado ao estoque físico da loja. Cada venda realizada no balcão atualiza o canal web automaticamente.",
    highlights: [
      "Catálogo online responsivo integrado ao ERP",
      "Estoque físico e virtual com baixa em tempo real",
      "Recebimento de pedidos direto na expedição da loja",
      "Checkout otimizado para aumentar a conversão",
    ],
    metricLabel: "Sincronização",
    metricValue: "Omnichannel",
    statNumber: "€ 8.940",
    statDesc: "Faturamento digital integrado",
  },
  {
    id: "ai",
    name: "Vendra AI",
    category: "Inteligência Empresarial",
    tagline: "Respostas estratégicas com base nos seus dados reais",
    description:
      "Motor analítico empresarial integrado à sua base de dados (powered by Multiplex) que responde dúvidas de faturamento, margem e estoque em linguagem natural.",
    highlights: [
      "Consultas em linguagem natural sobre finanças e estoque",
      "Identificação preditiva de rupturas antes que ocorram",
      "Diagnósticos de rentabilidade por linha de produto",
      "Isolamento completo e segurança dos dados por empresa",
    ],
    metricLabel: "Motor de IA",
    metricValue: "Multiplex",
    statNumber: "41,8%",
    statDesc: "Margem média auditada pela IA",
  },
];

// 8 Segmentos Especializados
const SEGMENTS_DATA = [
  {
    id: "farmacia",
    name: "Farmácias",
    title: "Farmácias & Drogarias",
    focus: "Rastreabilidade e controle rigoroso de lotes",
    description:
      "Controle de datas de validade, lotes de medicamentos, princípio ativo, dosagens e retenção de receitas médicas em conformidade com órgãos reguladores.",
    attributes: [
      { label: "Controle de Lote", detail: "Rastreio completo da entrada à dispensação" },
      { label: "Data de Validade", detail: "Alertas automáticos antes do vencimento" },
      { label: "Princípio Ativo", detail: "Busca ágil de similares e genéricos" },
      { label: "Receituário", detail: "Registro de prescrição quando aplicável" },
    ],
    previewKpi: "Lotes Monitorados",
    previewValue: "100%",
  },
  {
    id: "mercado",
    name: "Supermercados",
    title: "Mercados & Supermercados",
    focus: "Venda rápida e pesáveis por balança",
    description:
      "Agilidade total na frente de caixa, leitura de códigos de barras sem latência, comunicação com balanças no checkout e gestão de departamentos como açougue e padaria.",
    attributes: [
      { label: "Venda Fracionada", detail: "Cálculo preciso por peso líquido (KG)" },
      { label: "Integração Balança", detail: "Leitura de peso e tara automática" },
      { label: "Frente de Caixa Rápida", detail: "Múltiplas formas de pagamento em segundos" },
      { label: "Departamentos", detail: "Controle de gôndola, hortifrúti e açougue" },
    ],
    previewKpi: "Tempo Médio por Item",
    previewValue: "< 1.5s",
  },
  {
    id: "moda",
    name: "Moda & Roupas",
    title: "Moda & Vestuário",
    focus: "Grade matricial de cor e tamanho",
    description:
      "Organização de coleções, matrizes de tamanho (P/M/G/GG) e cores, etiquetas de código de barras personalizadas e controle de estoque de peças em loja e depósito.",
    attributes: [
      { label: "Grade Multidimensional", detail: "Controle de Cor x Tamanho sem duplicar cadastros" },
      { label: "Coleções e Estações", detail: "Acompanhamento do ciclo de vida das coleções" },
      { label: "Etiquetas Próprias", detail: "Impressão com código de barras e referência" },
      { label: "Estoque Consolidado", detail: "Visão precisa de peças em arara e estoque" },
    ],
    previewKpi: "Controle de Grade",
    previewValue: "Matricial",
  },
  {
    id: "gastronomia",
    name: "Restaurantes",
    title: "Restaurantes & Bares",
    focus: "Mesas, comandas e ficha técnica",
    description:
      "Gestão de mesas e comandas eletrônicas, envio de pedidos direto para a cozinha, controle de adicionais e baixa automática de ingredientes via ficha técnica.",
    attributes: [
      { label: "Controle de Mesas", detail: "Status em tempo real de ocupação e consumo" },
      { label: "Comanda Individual", detail: "Divisão de contas simplificada no fechamento" },
      { label: "Ficha Técnica", detail: "Baixa proporcional de insumos do estoque" },
      { label: "Pedidos de Cozinha", detail: "Organização clara para produção de pratos" },
    ],
    previewKpi: "Gestão de Salão",
    previewValue: "Sincronizada",
  },
  {
    id: "beleza",
    name: "Beleza & Estética",
    title: "Salões & Clínicas de Estética",
    focus: "Agendamento e comissão de profissionais",
    description:
      "Agenda compartilhada de horários e procedimentos, controle de serviços executados, comissões automáticas para profissionais e histórico de preferências dos clientes.",
    attributes: [
      { label: "Agenda Integrada", detail: "Horários por profissional e sala de atendimento" },
      { label: "Cálculo de Comissões", detail: "Regras percentuais ou fixas por serviço" },
      { label: "Venda Combinada", detail: "Lançamento de serviço e produto na mesma conta" },
      { label: "Histórico de Clientes", detail: "Ficha de procedimentos anteriores" },
    ],
    previewKpi: "Cálculo de Comissão",
    previewValue: "Automático",
  },
  {
    id: "petshop",
    name: "Pet Shops",
    title: "Pet Shops & Veterinárias",
    focus: "Serviços, banho, tosa e rações",
    description:
      "Gestão de banho e tosa, histórico do pet (espécie, porte e raça), vendas de ração a granel fracionada e controle de medicamentos veterinários no mesmo sistema.",
    attributes: [
      { label: "Perfil do Animal", detail: "Porte, raça, espécie e cuidados especiais" },
      { label: "Fila de Banho & Tosa", detail: "Acompanhamento do status do serviço" },
      { label: "Ração Fracionada", detail: "Venda pesada por quilo no ponto de venda" },
      { label: "Histórico Clínico", detail: "Registro de vacinas e atendimentos" },
    ],
    previewKpi: "Histórico do Pet",
    previewValue: "Unificado",
  },
  {
    id: "eletronicos",
    name: "Eletrônicos",
    title: "Eletrônicos & Assistência",
    focus: "Número de série, IMEI e garantias",
    description:
      "Rastreamento de itens de alto valor por número de série e IMEI no momento da venda, ordens de serviço para manutenção técnica e controle de prazos de garantia.",
    attributes: [
      { label: "Serial & IMEI", detail: "Registro obrigatório no checkout para segurança" },
      { label: "Ordens de Serviço", detail: "Entrada, diagnóstico e reparo de equipamentos" },
      { label: "Prazos de Garantia", detail: "Consulta rápida pela nota ou número de série" },
      { label: "Histórico Técnico", detail: "Peças utilizadas e mão de obra aplicada" },
    ],
    previewKpi: "Rastreio Unitário",
    previewValue: "Serial / IMEI",
  },
  {
    id: "construcao",
    name: "Construção",
    title: "Materiais de Construção",
    focus: "Unidades fracionadas e orçamentos",
    description:
      "Suporte a unidades diversas (m², m³, sacos, barras), geração de orçamentos estruturados, entregas parceladas em obra e regras de preço para atacado e varejo.",
    attributes: [
      { label: "Múltiplas Unidades", detail: "Cálculo em metro quadrado, cúbico ou unitário" },
      { label: "Emissão de Orçamentos", detail: "Propostas comerciais com validade e descontos" },
      { label: "Entregas Programadas", detail: "Controle de saídas parciais para canteiros" },
      { label: "Preços por Volume", detail: "Tabelas diferenciadas para atacado e construtoras" },
    ],
    previewKpi: "Cálculo de Medidas",
    previewValue: "Multidimensional",
  },
];

// Perguntas para demonstração visual da IA
const AI_DEMO_CASES = [
  {
    question: "Quanto a empresa faturou hoje e qual a margem média?",
    tag: "Financeiro & Vendas",
    answer:
      "Hoje foram consolidadas 142 vendas somando € 4.820,50, com margem bruta média de 41,8%. A filial Matriz respondeu por 64% do volume.",
    details: [
      { label: "Vendas Consolidadas", val: "142 operações" },
      { label: "Faturamento Bruto", val: "€ 4.820,50" },
      { label: "Margem Média", val: "41,8%" },
    ],
  },
  {
    question: "Quais produtos atingiram o estoque mínimo nesta semana?",
    tag: "Gestão de Estoque",
    answer:
      "Três itens entraram na faixa de reposição: Amoxicilina 500mg (4 unidades), Queijo Prato Fatiado (1,2 kg) e Camisa Linho M (1 unidade). Sugiro emissão de ordem de compra.",
    details: [
      { label: "Itens Críticos", val: "3 produtos" },
      { label: "Fornecedores Sugeridos", val: "2 cadastrados" },
      { label: "Impacto em Vendas", val: "Alto giro" },
    ],
  },
  {
    question: "Qual o desempenho comparativo entre as filiais este mês?",
    tag: "Performance por Loja",
    answer:
      "A Filial Centro atingiu 108% da meta projetada com € 68.400,00 faturados, enquanto a Matriz operou com maior estabilidade em ticket médio (€ 54,20).",
    details: [
      { label: "Líder de Faturamento", val: "Filial Centro" },
      { label: "Ticket Médio", val: "€ 54,20" },
      { label: "Meta Atingida", val: "108%" },
    ],
  },
];

// Planos Oficiais Aprovados
const APPROVED_PLANS = [
  {
    name: "STARTER",
    price: "€29",
    period: "/mês",
    tagline: "Para pequenos comércios e lojas individuais que precisam de gestão confiável.",
    featured: false,
    cta: "Iniciar com Starter",
    features: [
      "1 Filial comercial ativa",
      "Vendra POS (Frente de Caixa Web) ilimitado",
      "Catálogo de produtos e controle de estoque",
      "Gestão financeira de fluxo de caixa e pagamentos",
      "Cadastro de clientes e histórico de compras",
      "Suporte por e-mail e base de conhecimento",
    ],
  },
  {
    name: "BUSINESS",
    price: "€59",
    period: "/mês",
    tagline: "Para empresas em crescimento e lojas com múltiplos segmentos operacionais.",
    featured: true,
    badge: "MAIS ESCOLHIDO",
    cta: "Experimentar Business",
    features: [
      "Até 3 Filiais comerciais conectadas",
      "Vendra POS Web e Desktop sincronizados",
      "Operação com Múltiplos Segmentos simultâneos",
      "Vendra AI integrado (Motor Multiplex)",
      "Controle avançado de lotes, validade e grades",
      "Integrações comerciais com canais de atendimento",
      "Suporte prioritário via chat",
    ],
  },
  {
    name: "PREMIUM",
    price: "€129",
    period: "/mês",
    tagline: "Para redes de lojas, supermercados e operações que exigem alta volumetria.",
    featured: false,
    cta: "Contratar Premium",
    features: [
      "Filiais comerciais ilimitadas",
      "Terminais de Vendra POS ilimitados por loja",
      "Vendra AI corporativo com consultas avançadas",
      "DRE estruturado, conciliação e centros de custo",
      "Relatórios executivos e indicadores consolidados",
      "Acesso completo a APIs e Webhooks",
      "Gerente de conta dedicado",
    ],
  },
];

function LandingPage() {
  const [activeProductTab, setActiveProductTab] = useState("erp");
  const [activeSegmentId, setActiveSegmentId] = useState("farmacia");
  const [activeAiDemoIndex, setActiveAiDemoIndex] = useState(0);

  const selectedProduct = ECOSYSTEM_PRODUCTS.find((p) => p.id === activeProductTab) || ECOSYSTEM_PRODUCTS[0];
  const selectedSegment = SEGMENTS_DATA.find((s) => s.id === activeSegmentId) || SEGMENTS_DATA[0];
  const selectedAiDemo = AI_DEMO_CASES[activeAiDemoIndex];

  return (
    <div className="min-h-screen bg-[#03060C] text-slate-100 font-sans antialiased selection:bg-cyan-500/25 selection:text-cyan-200 overflow-x-hidden relative">
      {/* 
        ========================================================================
        ILUMINAÇÃO DE FUNDO EDITORIAL & ECLIPSE AURORA (REFS: CUNDO & NEXUSAI)
        ========================================================================
      */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glow Superior Centralizado tipo Aurora Boreal */}
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[95vw] max-w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.22),rgba(6,182,212,0.18)_35%,rgba(59,130,246,0.08)_65%,transparent_80%)] blur-[120px] rounded-full" />
        
        {/* Colunas Arquiteturais de Luz em Azul e Teal */}
        <div className="absolute top-20 left-[12%] w-[420px] h-[750px] bg-blue-600/[0.04] blur-[160px] rounded-full" />
        <div className="absolute top-24 right-[12%] w-[420px] h-[750px] bg-teal-500/[0.05] blur-[160px] rounded-full" />
        
        {/* Micro-malha geométrica de alta definição */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_65%,transparent_100%)] opacity-35" />
      </div>

      {/* 
        ========================================================================
        NAVBAR EDITORIAL & DISCRETA
        ========================================================================
      */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#03060C]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGOTIPO OFICIAL */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(45,212,191,0.25)]">
              <div className="w-full h-full bg-[#03060C] rounded-[10px] flex items-center justify-center font-black text-cyan-400 text-base">
                V
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white leading-tight">
                VENDRA
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                by BonaSoft
              </span>
            </div>
          </Link>

          {/* NAVEGAÇÃO CENTRAL */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#produtos" className="hover:text-cyan-400 transition-colors">
              Produtos
            </a>
            <a href="#gestao" className="hover:text-cyan-400 transition-colors">
              Plataforma
            </a>
            <a href="#segmentos" className="hover:text-cyan-400 transition-colors">
              Segmentos
            </a>
            <a href="#ia" className="hover:text-cyan-400 transition-colors">
              Vendra AI
            </a>
            <a href="#multiplataforma" className="hover:text-cyan-400 transition-colors">
              Multiplataforma
            </a>
            <a href="#planos" className="hover:text-cyan-400 transition-colors">
              Planos
            </a>
          </nav>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center gap-3">
            <Link
              to="/entrar"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/entrar"
              className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center gap-2 shadow-sm hover:border-cyan-500/40"
            >
              Solicitar demonstração <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        HERO SECTION: ECLIPSE AURORA COM MOCKUP MASTER CENTRALIZADO (PÁGINA DE MILHÕES)
        ========================================================================
      */}
      <section className="relative z-10 pt-16 pb-24 md:pt-24 md:pb-36 text-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* PILL BADGE ELEGANTE COM PONTO DE PULSO LUMINOSO (ESTÉTICA NATIONFLY & CUNDO) */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-xs font-medium text-slate-200 shadow-[0_0_25px_rgba(0,0,0,0.6)] mb-8 hover:border-cyan-500/35 transition-all"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></span>
            </span>
            <span className="tracking-wider uppercase text-[10px] font-extrabold text-slate-100">
              VENDRA BY BONASOFT
            </span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400 font-normal">Plataforma Empresarial Unificada</span>
          </motion.div>

          {/* HEADLINE MONUMENTAL & EDITORIAL COM TEXT-BALANCE */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] text-white max-w-4xl mx-auto leading-[1.08] text-balance"
          >
            Seu negócio merece uma <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              gestão extraordinária.
            </span>
          </motion.h1>

          {/* SUBHEADLINE CLARA E BEM ESPAÇADA */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal text-balance"
          >
            Uma plataforma para conectar vendas, estoque, financeiro e inteligência empresarial em todas as operações
            da sua empresa.
          </motion.p>

          {/* BOTÕES DE AÇÃO DE ALTO PADRÃO */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#produtos"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-[0_0_35px_rgba(45,212,191,0.35)] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Conhecer a plataforma <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              to="/entrar"
              className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/12 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-xs tracking-wide backdrop-blur-md transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
            >
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <Play className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400 ml-0.5" />
              </span>
              Solicitar demonstração
            </Link>
          </motion.div>

          {/* 
            ========================================================================
            MOCKUP MASTER DO SOFTWARE COM AURORA HALO DE FUNDO (REFERÊNCIA CUNDO)
            ========================================================================
          */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 sm:mt-24 max-w-5xl mx-auto relative text-left"
          >
            {/* LUZ AURORA HALO VERDE/CIANO QUE CRIA O EFEITO DE ECLIPSE (ESTÉTICA CUNDO) */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[88%] max-w-3xl h-[280px] bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.35),rgba(6,182,212,0.25)_35%,rgba(16,185,129,0.12)_65%,transparent_80%)] blur-[95px] rounded-full pointer-events-none z-0" />

            {/* MOLDURA DO SOFTWARE DE LUXO */}
            <div className="relative z-10 rounded-2xl border border-white/[0.14] bg-[#070A14]/95 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-400/80 before:to-transparent">
              
              {/* BARRA SUPERIOR DO APLICATIVO COM ATRIBUTOS REAIS */}
              <div className="h-12 border-b border-white/[0.08] bg-[#050811] px-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/[0.08]">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono text-slate-300">
                      <Search className="w-3 h-3 text-slate-400" />
                      <span>vendra.app/painel/operacoes</span>
                      <span className="ml-2 px-1.5 py-0.2 rounded bg-white/[0.08] text-[9px] text-slate-400">⌘K</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    4 Filiais Online
                  </span>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center">
                    B
                  </div>
                </div>
              </div>

              {/* CONTEÚDO VISUAL RICO DO DASHBOARD */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* LINHA DE INDICADORES PRINCIPAIS COM DADOS REAIS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Faturamento Hoje", val: "€ 48.250,80", sub: "+24,6% vs ontem", icon: DollarSign, color: "text-cyan-400", badgeColor: "text-emerald-400 bg-emerald-500/10" },
                    { label: "Vendas no Balcão", val: "184 pedidos", sub: "Liquidado em 1.2s", icon: Receipt, color: "text-teal-400", badgeColor: "text-teal-400 bg-teal-500/10" },
                    { label: "Margem Operacional", val: "42,4%", sub: "+3,8% rentabilidade", icon: TrendingUp, color: "text-emerald-400", badgeColor: "text-cyan-400 bg-cyan-500/10" },
                    { label: "Giro de Estoque", val: "99,4%", sub: "Ruptura zero auditada", icon: Boxes, color: "text-cyan-300", badgeColor: "text-emerald-400 bg-emerald-500/10" },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={idx}
                        className="p-4.5 rounded-xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.045] transition-all relative group"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-xs">
                          <span>{stat.label}</span>
                          <Icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-white mt-2 tracking-tight">
                          {stat.val}
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${stat.badgeColor}`}>
                            {stat.sub}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* GRÁFICO DE VENDAS CONSOLIDADAS + LIVE FEED DE FRENTE DE CAIXA */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* GRÁFICO COM EIXOS E BARRAS COM BRILHO */}
                  <div className="lg:col-span-8 p-5 sm:p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-bold text-white">Desempenho Comercial Consolidado</div>
                        <div className="text-xs text-slate-400 mt-0.5">Vendas integradas por hora (PDV Balcão + Venda Digital)</div>
                      </div>
                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                        Hoje · Tempo Real
                      </span>
                    </div>

                    {/* GRÁFICO EM BARRAS DE PROPORÇÃO ELEGANTE */}
                    <div className="h-36 w-full flex items-end gap-2 sm:gap-2.5 pt-6">
                      {[30, 45, 52, 40, 70, 64, 88, 80, 95, 110, 125, 115, 140, 128].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                          <div
                            style={{ height: `${(h / 140) * 100}%` }}
                            className="w-full rounded-t-sm bg-gradient-to-t from-teal-500/20 via-cyan-400/60 to-cyan-400 group-hover:to-cyan-200 transition-all shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                          />
                          <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">
                            {i + 8}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* LIVE POS TERMINAL FEED */}
                  <div className="lg:col-span-4 p-5 sm:p-6 rounded-xl border border-white/[0.08] bg-white/[0.02] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Frente de Caixa (PDV)</span>
                        <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          Terminal 01 · Ativo
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Última operação registrada no balcão</div>

                      <div className="mt-4 space-y-2.5 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span className="truncate pr-2 font-medium">2x Dipirona Monoidratada 500mg</span>
                          <span className="font-mono text-slate-400">€ 25,00</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="truncate pr-2 font-medium">1x Protetor Solar Facial FPS 50</span>
                          <span className="font-mono text-slate-400">€ 42,50</span>
                        </div>
                        <div className="pt-3 border-t border-white/[0.08] flex justify-between font-bold text-white text-sm">
                          <span>Total da Venda</span>
                          <span className="font-mono text-cyan-400 text-base">€ 67,50</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/[0.08]">
                      <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                        Liquidado via Cartão/PIX
                      </span>
                      <span className="font-mono text-slate-400">Cupom #8492</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 2: O ECOSSISTEMA VENDRA (5 PRODUTOS COM ARQUITETURA UNIFICADA)
        ========================================================================
      */}
      <section id="produtos" className="relative z-10 py-24 md:py-36 border-t border-white/[0.08] bg-[#040710]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Arquitetura Unificada
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight text-balance">
              Cinco pilares. Uma única base de dados.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg leading-relaxed text-balance">
              Cada produto resolve uma etapa fundamental da empresa, eliminando pontes frágeis entre softwares isolados.
            </p>
          </div>

          {/* SELETOR EM ABAS DOS 5 PRODUTOS COM ESTÉTICA DE CÁPSULA */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] max-w-2xl mx-auto mb-14 backdrop-blur-md">
            {ECOSYSTEM_PRODUCTS.map((prod) => (
              <button
                key={prod.id}
                onClick={() => setActiveProductTab(prod.id)}
                className={`flex-1 min-w-[110px] py-3 px-4 rounded-full text-xs font-bold transition-all ${
                  activeProductTab === prod.id
                    ? "bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-emerald-500/20 text-white border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {prod.name}
              </button>
            ))}
          </div>

          {/* DEMONSTRAÇÃO EDITORIAL DO PRODUTO ATIVO */}
          <div className="rounded-3xl border border-white/[0.1] bg-[#060914]/90 backdrop-blur-xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[120px] pointer-events-none" />

            {/* LADO TEXTUAL */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/20 inline-block">
                {selectedProduct.category}
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                {selectedProduct.tagline}
              </h3>
              <p className="text-base text-slate-300 leading-relaxed font-normal">
                {selectedProduct.description}
              </p>

              <div className="space-y-3.5 pt-2">
                {selectedProduct.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to="/entrar"
                  className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Ver demonstração guiada do {selectedProduct.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* LADO VISUAL / INTERFACE SIMULADA DO PRODUTO */}
            <div className="lg:col-span-6 rounded-2xl border border-white/[0.1] bg-[#080D1C] p-6 sm:p-8 space-y-5 shadow-2xl text-left">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 text-sm">
                <div className="font-extrabold text-white text-base">{selectedProduct.name}</div>
                <div className="text-xs text-slate-400 font-mono">
                  {selectedProduct.metricLabel}: <span className="text-cyan-400 font-bold">{selectedProduct.metricValue}</span>
                </div>
              </div>

              {/* STAT HIGHLIGHT CARD */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="text-2xl font-extrabold text-white tracking-tight">{selectedProduct.statNumber}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{selectedProduct.statDesc}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>

              {/* DEMO CONTEXTUAL DEPENDENDO DO PRODUTO */}
              {selectedProduct.id === "erp" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Fluxo de Caixa Consolidado</div>
                      <div className="text-[11px] text-slate-400">Entradas, saídas e projeção de saldo bancário</div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold text-sm">+ € 18.250,00</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Compras Programadas</div>
                      <div className="text-[11px] text-slate-400">Sugestão calculada automaticamente pelo giro de estoque</div>
                    </div>
                    <span className="font-mono text-slate-300 font-semibold">4 ordens prontas</span>
                  </div>
                </div>
              )}

              {selectedProduct.id === "pos" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Leitor de Código de Barras EAN-13</div>
                      <div className="text-[11px] text-slate-400">Identificação instantânea de item e peso</div>
                    </div>
                    <span className="text-cyan-400 font-mono font-bold text-sm">18ms</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Fechamento com Divergência Zero</div>
                      <div className="text-[11px] text-slate-400">Totalização por dinheiro, cartão e PIX auditada</div>
                    </div>
                    <span className="text-emerald-400 font-bold">Auditado</span>
                  </div>
                </div>
              )}

              {selectedProduct.id === "mobile" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Gestão Remota de Lojas</div>
                      <div className="text-[11px] text-slate-400">Faturamento e pedidos em tempo real no smartphone</div>
                    </div>
                    <span className="text-cyan-400 font-semibold">Sincronizado</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Alertas Operacionais</div>
                      <div className="text-[11px] text-slate-400">Notificação imediata de metas atingidas e estoque baixo</div>
                    </div>
                    <span className="text-slate-300 font-mono">Push ativo</span>
                  </div>
                </div>
              )}

              {selectedProduct.id === "store" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Estoque Unificado (Loja + Web)</div>
                      <div className="text-[11px] text-slate-400">Item vendido no balcão atualiza o catálogo virtual na hora</div>
                    </div>
                    <span className="text-emerald-400 font-bold">100% Sincronizado</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Checkout Descomplicado</div>
                      <div className="text-[11px] text-slate-400">Pagamento online com geração direta de pedido na expedição</div>
                    </div>
                    <span className="text-cyan-400 font-semibold">Integrado</span>
                  </div>
                </div>
              )}

              {selectedProduct.id === "ai" && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Motor Multiplex Integrado</div>
                      <div className="text-[11px] text-slate-400">Consultas analíticas diretamente na base de dados da empresa</div>
                    </div>
                    <span className="text-cyan-400 font-mono font-bold">Nativo</span>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.06] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Previsão de Ruptura de Gôndola</div>
                      <div className="text-[11px] text-slate-400">Cálculo de esgotamento pelo ritmo histórico de vendas</div>
                    </div>
                    <span className="text-emerald-400 font-semibold">Preditivo</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 3: GESTÃO CENTRALIZADA (RELATÓRIO EXECUTIVO & FILIAIS)
        ========================================================================
      */}
      <section id="gestao" className="relative z-10 py-24 md:py-36 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* TEXTO EDITORIAL */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
                Centralização Operacional
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight text-balance">
                Vendas, estoque, compras e financeiro em sintonia.
              </h2>
              <p className="text-base text-slate-400 leading-relaxed font-normal">
                Quando uma venda é registrada no Vendra POS, a baixa no estoque é imediata, a conta a receber é alimentada
                e o relatório financeiro do Vendra ERP é atualizado instantaneamente.
              </p>
              <div className="space-y-3.5 pt-2">
                {[
                  "Fim de reconciliações manuais no final do mês",
                  "Histórico transparente de cada movimento financeiro",
                  "Controle de acesso por função (caixa, estoquista, gerente)",
                  "Relatórios executivos consolidados de todas as filiais",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DEMONSTRAÇÃO VISUAL DO DEMONSTRATIVO FINANCEIRO */}
            <div className="lg:col-span-7 rounded-3xl border border-white/[0.1] bg-[#070A14] p-6 sm:p-8 shadow-2xl relative overflow-hidden text-left">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-extrabold text-white">Demonstrativo Financeiro e Operacional</span>
                </div>
                <span className="text-xs font-mono text-slate-400">Atualização Contínua</span>
              </div>

              {/* CARDS DE RECEITA E RESULTADO */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3.5 text-center">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Receita Bruta</div>
                    <div className="text-lg font-bold text-white mt-1">€ 48.200,00</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Custo dos Produtos</div>
                    <div className="text-lg font-bold text-slate-300 mt-1">€ 28.100,00</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Resultado Líquido</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">€ 20.100,00</div>
                  </div>
                </div>

                {/* TABELA DE FILIAIS COM STATUS EM TEMPO REAL */}
                <div className="rounded-xl border border-white/[0.08] overflow-hidden text-xs">
                  <div className="bg-white/[0.04] px-4 py-3 font-bold text-slate-300 text-xs flex justify-between">
                    <span>Filial</span>
                    <span>Vendas Hoje</span>
                    <span>Status Operacional</span>
                  </div>
                  <div className="divide-y divide-white/[0.05]">
                    {[
                      { filial: "Matriz Centro", vendas: "€ 3.110,00", status: "Caixa Aberto" },
                      { filial: "Filial Norte", vendas: "€ 1.710,50", status: "Caixa Aberto" },
                      { filial: "Loja Virtual (Store)", vendas: "€ 890,00", status: "Integrada" },
                    ].map((row, rIdx) => (
                      <div key={rIdx} className="px-4 py-3.5 flex justify-between items-center text-slate-300">
                        <span className="font-semibold text-white">{row.filial}</span>
                        <span className="font-mono text-slate-200">{row.vendas}</span>
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 4: SEGMENTOS COMERCIAIS ESPECIALIZADOS
        ========================================================================
      */}
      <section id="segmentos" className="relative z-10 py-24 md:py-36 border-t border-white/[0.08] bg-[#040710]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Especialização Comercial
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight text-balance">
              Uma plataforma adaptada para cada setor.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg leading-relaxed text-balance">
              Selecione seu segmento e veja como o VENDRA adapta seus fluxos para a realidade do seu balcão.
            </p>
          </div>

          {/* NAVEGAÇÃO DE SEGMENTOS — BOTOES EM PÍLULA */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
            {SEGMENTS_DATA.map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegmentId(seg.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                  activeSegmentId === seg.id
                    ? "bg-white/10 text-white border border-white/25 shadow-sm"
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {seg.name}
              </button>
            ))}
          </div>

          {/* COMPOSIÇÃO EDITORIAL DO SEGMENTO ESCOLHIDO */}
          <div className="rounded-3xl border border-white/[0.1] bg-[#060914]/90 backdrop-blur-xl p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center shadow-2xl">
            <div className="lg:col-span-5 space-y-5 text-left">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold px-3 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/20 inline-block">
                {selectedSegment.focus}
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white">
                {selectedSegment.title}
              </h3>
              <p className="text-base text-slate-300 leading-relaxed font-normal">
                {selectedSegment.description}
              </p>

              <div className="pt-3">
                <Link
                  to="/entrar"
                  className="inline-flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300"
                >
                  Conhecer solução para {selectedSegment.name} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* DEMONSTRAÇÃO VISUAL DOS ATRIBUTOS ESPECÍFICOS */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {selectedSegment.attributes.map((attr, aIdx) => (
                <div key={aIdx} className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.045] transition-colors">
                  <div className="text-sm font-bold text-white">{attr.label}</div>
                  <div className="text-xs text-slate-400 mt-1.5 leading-relaxed font-normal">{attr.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 5: VENDRA AI (CONVERSA VISUAL COM DEMONSTRAÇÃO CLARA)
        ========================================================================
      */}
      <section id="ia" className="relative z-10 py-24 md:py-36 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Vendra AI Engine (Powered by Multiplex)
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight text-balance">
              A inteligência artificial que entende o seu negócio.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg leading-relaxed text-balance">
              Consulte seu faturamento, analise tendências de estoque e receba diagnósticos operacionais em linguagem
              natural direto da sua base de dados.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* SELEÇÃO DE PERGUNTAS DE GESTÃO */}
            <div className="lg:col-span-5 space-y-3.5 text-left">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Perguntas Frequentes de Gestão:
              </div>
              {AI_DEMO_CASES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveAiDemoIndex(idx)}
                  className={`w-full p-4.5 rounded-2xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    idx === activeAiDemoIndex
                      ? "border-cyan-500/50 bg-white/[0.06] text-white shadow-md shadow-cyan-500/10"
                      : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="pr-2 leading-relaxed">&ldquo;{item.question}&rdquo;</span>
                  <ChevronRight className="w-4 h-4 shrink-0 text-cyan-400" />
                </button>
              ))}
            </div>

            {/* PAINEL DE DIÁLOGO E INDICADORES DA IA */}
            <div className="lg:col-span-7 rounded-3xl border border-white/[0.1] bg-[#070A14] p-7 sm:p-8 space-y-5 shadow-2xl relative overflow-hidden text-left">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-extrabold text-xs">
                    V
                  </div>
                  <span className="font-extrabold text-white text-sm">Vendra AI</span>
                  <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/[0.05]">
                    Ambiente Demonstrativo
                  </span>
                </div>
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                  {selectedAiDemo.tag}
                </span>
              </div>

              {/* PERGUNTA */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-200">
                <span className="text-slate-400 font-mono mr-2">Pergunta do Gestor:</span>
                &ldquo;{selectedAiDemo.question}&rdquo;
              </div>

              {/* RESPOSTA ANALÍTICA */}
              <div className="p-5 rounded-xl bg-cyan-500/[0.05] border border-cyan-500/30 space-y-4">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                  {selectedAiDemo.answer}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-cyan-500/20">
                  {selectedAiDemo.details.map((d, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider">{d.label}</div>
                      <div className="text-xs sm:text-sm font-bold text-cyan-300 mt-0.5 font-mono">{d.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Seus dados empresariais operam em ambiente seguro e isolado por tenant.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 6: MULTIPLATAFORMA (DESKTOP, PDV, TABLET E SMARTPHONE)
        ========================================================================
      */}
      <section id="multiplataforma" className="relative z-10 py-24 md:py-36 border-t border-white/[0.08] bg-[#040710]/70 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Flexibilidade Operacional
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight text-balance">
              Sua empresa opera em qualquer dispositivo.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg leading-relaxed text-balance">
              Do escritório de retaguarda ao balcão de vendas e à gestão em trânsito.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
            {[
              {
                title: "Painel Web",
                subtitle: "Navegador Desktop",
                desc: "Retaguarda completa para compras, relatórios, cadastros e parametrizações fiscais.",
                icon: Laptop,
              },
              {
                title: "Vendra POS",
                subtitle: "Web & Desktop",
                desc: "Frente de caixa rápida com teclado, leitor de código de barras e balança.",
                icon: Store,
              },
              {
                title: "Vendra Mobile",
                subtitle: "Smartphones",
                desc: "Acompanhe faturamento, aprove compras e consulte estoque na palma da mão.",
                icon: Smartphone,
              },
              {
                title: "Vendra Store",
                subtitle: "Portal Digital",
                desc: "Catálogo online unificado com estoque em tempo real para seus clientes.",
                icon: ShoppingBag,
              },
            ].map((d, i) => {
              const Icon = d.icon;
              return (
                <div
                  key={i}
                  className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-base font-bold text-white">{d.title}</div>
                    <div className="text-xs text-cyan-400 font-mono mt-0.5">{d.subtitle}</div>
                    <p className="text-xs text-slate-400 mt-3.5 leading-relaxed font-normal">{d.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 7: PLANOS E PREÇOS TRANSPARENTES
        ========================================================================
      */}
      <section id="planos" className="relative z-10 py-24 md:py-36 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Transparência Comercial
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight text-balance">
              Planos objetivos para cada estágio do seu negócio.
            </h2>
            <p className="text-slate-400 mt-4 text-base leading-relaxed text-balance">
              Valores mensais sem IVA. Cancele ou altere a qualquer momento sem pegadinhas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto text-left">
            {APPROVED_PLANS.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-8 sm:p-9 border flex flex-col justify-between transition-all relative ${
                  plan.featured
                    ? "border-cyan-500/50 bg-gradient-to-b from-white/[0.06] via-[#090D1A] to-[#060914] shadow-[0_0_60px_rgba(34,211,238,0.2)]"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1.5 mt-4">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">{plan.price}</span>
                    <span className="text-slate-400 text-sm font-medium">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed font-normal">{plan.tagline}</p>

                  <div className="my-7 border-t border-white/[0.08]" />

                  <div className="space-y-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Recursos inclusos:
                    </div>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-9 pt-6 border-t border-white/[0.08]">
                  <Link
                    to="/entrar"
                    className={`w-full py-3.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 ${
                      plan.featured
                        ? "bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 shadow-md shadow-cyan-500/30"
                        : "border border-white/12 hover:border-white/25 bg-white/[0.04] text-white"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 8: CONVERSÃO FINAL & RODAPÉ EDITORIAL
        ========================================================================
      */}
      <section className="relative z-10 py-24 md:py-36 border-t border-white/[0.08] bg-[#040710]/70 text-center relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight text-balance">
            Seu negócio merece o próximo nível.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed text-balance">
            Centralize sua operação, simplifique processos de balcão e tome decisões respaldadas em dados reais.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/entrar"
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-[0_0_35px_rgba(45,212,191,0.35)] transition-all flex items-center justify-center gap-2"
            >
              Começar agora <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/entrar"
              className="w-full sm:w-auto px-9 py-4 rounded-full border border-white/12 hover:border-white/25 bg-white/[0.04] text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2"
            >
              Solicitar demonstração
            </Link>
          </div>
        </div>
      </section>

      {/* RODAPÉ EDITORIAL ELEGANTE */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#020409] py-16 text-xs text-slate-400 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            {/* IDENTIDADE */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 flex items-center justify-center font-black text-sm">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-white text-base">VENDRA</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">by BonaSoft</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Plataforma integrada de gestão comercial, ponto de venda e inteligência artificial empresarial.
              </p>
              <div className="text-[11px] text-slate-500">
                BonaSoft Technologies. Todos os direitos reservados.
              </div>
            </div>

            {/* PRODUTOS */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Produtos</div>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#produtos" className="hover:text-white transition-colors">Vendra ERP</a></li>
                <li><a href="#produtos" className="hover:text-white transition-colors">Vendra POS</a></li>
                <li><a href="#produtos" className="hover:text-white transition-colors">Vendra Mobile</a></li>
                <li><a href="#produtos" className="hover:text-white transition-colors">Vendra Store</a></li>
                <li><a href="#ia" className="hover:text-white transition-colors">Vendra AI</a></li>
              </ul>
            </div>

            {/* SEGMENTOS */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Segmentos</div>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#segmentos" className="hover:text-white transition-colors">Farmácias</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Supermercados</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Moda & Vestuário</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Restaurantes</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Materiais de Construção</a></li>
              </ul>
            </div>

            {/* INSTITUCIONAL */}
            <div className="space-y-3">
              <div className="font-bold text-white text-xs uppercase tracking-wider">Institucional</div>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/entrar" className="hover:text-white transition-colors">Central de Acesso</Link></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos & Preços</a></li>
                <li><span className="text-slate-500">Termos de Uso</span></li>
                <li><span className="text-slate-500">Privacidade</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>© {new Date().getFullYear()} VENDRA by BonaSoft. Gestão comercial e tecnologia empresarial.</div>
            <div>Brasil & Espanha</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
