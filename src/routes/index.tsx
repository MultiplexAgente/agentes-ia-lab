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
  Cpu,
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
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VENDRA | Seu negócio merece uma gestão extraordinária" },
      {
        name: "description",
        content:
          "Uma plataforma para conectar vendas, estoque, financeiro e inteligência empresarial em todas as operações da sua empresa. by BonaSoft.",
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

// Os 5 Produtos Vendra
const ECOSYSTEM_PRODUCTS = [
  {
    id: "erp",
    name: "Vendra ERP",
    category: "Gestão Empresarial Centralizada",
    tagline: "O núcleo operacional e financeiro da sua empresa",
    description:
      "Controle completo de compras, estoques múltiplos, contas a pagar e receber, fluxo de caixa e relatórios gerenciais consolidados em tempo real.",
    highlights: [
      "Visão consolidada de matriz e filiais",
      "Controle financeiro com fluxo de caixa diário",
      "Gestão de compras e giro de estoque",
      "Cadastros unificados de produtos e parceiros",
    ],
    metricLabel: "Visibilidade Financeira",
    metricValue: "Tempo Real",
  },
  {
    id: "pos",
    name: "Vendra POS",
    category: "Frente de Caixa Ágil",
    tagline: "Velocidade e precisão no momento da venda",
    description:
      "Frente de caixa intuitiva para telas touchscreen, teclado e leitor de código de barras. Suporta venda fracionada por balança e múltiplos meios de pagamento.",
    highlights: [
      "Leitura instantânea de código de barras e EAN",
      "Operação com pesáveis e venda fracionada",
      "Abertura, suprimento, sangria e fechamento seguro",
      "Divisão de pagamentos (Dinheiro, Cartão, PIX)",
    ],
    metricLabel: "Agilidade no Caixa",
    metricValue: "Instantâneo",
  },
  {
    id: "mobile",
    name: "Vendra Mobile",
    category: "Gestão na Palma da Mão",
    tagline: "Acompanhe sua empresa de onde estiver",
    description:
      "Aplicativo para gestores e equipes operacionais consultarem indicadores de vendas, aprovarem pedidos e receberem notificações críticas de estoque.",
    highlights: [
      "Dashboard executivo em smartphones",
      "Notificações de metas e fechamento diário",
      "Consulta ágil de preços e disponibilidade",
      "Aprovações operacionais a distância",
    ],
    metricLabel: "Mobilidade",
    metricValue: "iOS & Android",
  },
  {
    id: "store",
    name: "Vendra Store",
    category: "Comércio Digital Integrado",
    tagline: "Suas vendas físicas e digitais sincronizadas",
    description:
      "Catálogo online e canal de vendas digital sincronizado com o estoque físico do ERP, permitindo receber pedidos direto na operação da loja.",
    highlights: [
      "Catálogo digital responsivo e elegante",
      "Estoque compartilhado com a loja física",
      "Recebimento de pedidos integrado ao ERP",
      "Experiência de compra fluida para o cliente",
    ],
    metricLabel: "Canais de Venda",
    metricValue: "Omnichannel",
  },
  {
    id: "ai",
    name: "Vendra AI",
    category: "Inteligência Empresarial",
    tagline: "Respostas estratégicas com base nos seus dados reais",
    description:
      "Motor inteligente integrado ao ERP (powered by Multiplex) que analisa vendas, margens e estoque para responder perguntas gerenciais em linguagem natural.",
    highlights: [
      "Consultas em linguagem natural sobre o negócio",
      "Identificação precoce de ruptura de estoque",
      "Análise de rentabilidade e produtos líderes",
      "Segurança e isolamento dos dados da empresa",
    ],
    metricLabel: "Decisões Estratégicas",
    metricValue: "Motor Analítico",
  },
];

// 8 Segmentos Especializados
const SEGMENTS_DATA = [
  {
    id: "farmacia",
    name: "Farmácias",
    title: "Farmácias & Drogarias",
    focus: "Rastreabilidade e controle de lotes",
    description:
      "Controle rigoroso de datas de validade, lotes de medicamentos, princípio ativo, dosagens e retenção de receitas médicas em conformidade com órgãos reguladores.",
    attributes: [
      { label: "Controle de Lote", detail: "Rastreio completo da entrada à dispensação" },
      { label: "Data de Validade", detail: "Alertas automáticos antes do vencimento" },
      { label: "Princípio Ativo", detail: "Busca rápida de similares e genéricos" },
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
    <div className="min-h-screen bg-[#04060A] text-slate-100 font-sans antialiased selection:bg-cyan-500/25 selection:text-cyan-200 overflow-x-hidden relative">
      {/* AURORA LUMINESCENTE & ILUMINAÇÃO DE FUNDO CINEMATOGRÁFICA (REFERÊNCIA CUNDO / NEXUSAI) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glow Superior Centralizado no Topo / Hero */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[90vw] max-w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.18),rgba(20,184,166,0.12)_40%,rgba(59,130,246,0.06)_70%,transparent_80%)] blur-[120px] rounded-full" />
        
        {/* Colunas Verticais Orgânicas de Luz Azul Profunda / Navy (NexusAI) */}
        <div className="absolute top-10 left-[15%] w-[350px] h-[700px] bg-blue-700/[0.04] blur-[150px] rounded-full" />
        <div className="absolute top-20 right-[15%] w-[350px] h-[700px] bg-teal-600/[0.05] blur-[150px] rounded-full" />
        
        {/* Glow Lateral Suave para Profundidade */}
        <div className="absolute top-[45%] right-[-5%] w-[600px] h-[600px] bg-cyan-600/[0.04] blur-[180px] rounded-full" />
        <div className="absolute top-[75%] left-[-5%] w-[600px] h-[600px] bg-emerald-600/[0.04] blur-[180px] rounded-full" />
        
        {/* Grid Sutil de Precisão */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,#000_65%,transparent_100%)] opacity-40" />
      </div>

      {/* NAVBAR MINIMALISTA, DISCRETA E ELEGANTE */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#04060A]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* LOGOTIPO */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 p-[1px] shadow-sm">
              <div className="w-full h-full bg-[#04060A] rounded-[7px] flex items-center justify-center font-black text-cyan-400 text-sm">
                V
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                VENDRA
              </span>
              <span className="text-[9px] text-slate-400 tracking-wider uppercase font-medium">
                by BonaSoft
              </span>
            </div>
          </Link>

          {/* LINKS DE NAVEGAÇÃO */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#produtos" className="hover:text-white transition-colors">
              Produtos
            </a>
            <a href="#gestao" className="hover:text-white transition-colors">
              Plataforma
            </a>
            <a href="#segmentos" className="hover:text-white transition-colors">
              Segmentos
            </a>
            <a href="#ia" className="hover:text-white transition-colors">
              Vendra AI
            </a>
            <a href="#multiplataforma" className="hover:text-white transition-colors">
              Multiplataforma
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Planos
            </a>
          </nav>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center gap-3">
            <Link
              to="/entrar"
              className="text-xs font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/entrar"
              className="px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white text-xs font-semibold tracking-wide transition-all active:scale-95 flex items-center gap-1.5 shadow-sm hover:border-cyan-500/30"
            >
              Solicitar demonstração <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* SEÇÃO 1: HERO SECTION CINEMATOGRÁFICA (COM REFERÊNCIAS NATIONFLY, NEXUSAI E CUNDO) */}
      <section className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          
          {/* PILL BADGE ELEGANTE COM PONTO LUMINOSO (ESTÉTICA NATIONFLY & CUNDO) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-[11px] font-medium text-slate-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-7 hover:border-cyan-500/30 transition-all cursor-default"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            </span>
            <span className="tracking-wider uppercase text-[10px] font-semibold text-slate-200">
              VENDRA BY BONASOFT
            </span>
            <span className="text-white/20">|</span>
            <span className="text-slate-400 font-normal">Plataforma Empresarial Unificada</span>
          </motion.div>

          {/* HEADLINE PRINCIPAL COM TIPOGRAFIA DE ALTO IMPACTO */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[-0.03em] text-white max-w-4xl mx-auto leading-[1.08]"
          >
            Seu negócio merece uma <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              gestão extraordinária.
            </span>
          </motion.h1>

          {/* SUBHEADLINE EQUILIBRADA E EDITORIAL */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal"
          >
            Uma plataforma para conectar vendas, estoque, financeiro e inteligência empresarial em todas as operações
            da sua empresa.
          </motion.p>

          {/* BOTÕES DE AÇÃO COM ESTÉTICA DE ALTA PRODUÇÃO */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <a
              href="#produtos"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 text-slate-950 font-bold text-xs tracking-wide shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              Conhecer a plataforma <ArrowRight className="w-4 h-4" />
            </a>

            <Link
              to="/entrar"
              className="w-full sm:w-auto px-7 py-3.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white font-medium text-xs backdrop-blur-md transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
            >
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Play className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400 ml-0.5" />
              </span>
              Solicitar demonstração
            </Link>
          </motion.div>

          {/* ELEMENTO ESCULTURAL IRIDESCENTE / 3D FLUID RIBBON (NATIONFLY AESTHETIC - ZERO ÍCONES DE IA) */}
          <div className="absolute right-4 top-1/4 -translate-y-1/2 w-48 h-48 md:w-64 md:h-64 pointer-events-none opacity-40 md:opacity-60 hidden lg:block">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-[0_15px_30px_rgba(6,182,212,0.3)] animate-pulse"
              style={{ animationDuration: "6s" }}
            >
              <defs>
                <linearGradient id="fluid-ribbon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                  <stop offset="35%" stopColor="#2dd4bf" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="fluid-sheen-grad" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#04060a" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              {/* Geometria escultural fluida (curvas harmoniosas representando fluxo contínuo de gestão) */}
              <path
                d="M 40 100 C 40 40, 100 30, 140 60 C 180 90, 170 150, 120 160 C 70 170, 40 130, 80 100 C 120 70, 150 110, 130 140"
                fill="none"
                stroke="url(#fluid-ribbon-grad)"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d="M 45 95 C 45 45, 98 35, 136 63 C 172 90, 164 146, 118 155"
                fill="none"
                stroke="url(#fluid-sheen-grad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* MOCKUP DO SOFTWARE COM AURORA HALO DE FUNDO (REFERÊNCIA CUNDO & NEXUSAI) */}
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-16 sm:mt-20 max-w-5xl mx-auto relative"
          >
            {/* LUZ AURORA HALO DIRETAMENTE ATRÁS DO DASHBOARD (ESTÉTICA CUNDO) */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[85%] max-w-3xl h-[280px] bg-gradient-to-r from-emerald-500/25 via-cyan-400/30 to-blue-600/25 blur-[110px] rounded-full pointer-events-none z-0" />

            {/* MOLDURA DO SOFTWARE — VIDRO OBSIDIANO, BORDA HIGHLIGHT E PROFUNDIDADE */}
            <div className="relative z-10 rounded-2xl border border-white/[0.12] bg-[#070A12]/95 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden text-left before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-400/60 before:to-transparent">
              {/* BARRA SUPERIOR DO APLICATIVO */}
              <div className="h-11 border-b border-white/[0.08] bg-[#05070E] px-4 sm:px-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/[0.08]">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[11px] font-mono text-slate-300 border border-white/[0.06]">
                      vendra.app · Painel Integrado
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  4 Filiais Conectadas · Operação ao Vivo
                </div>
              </div>

              {/* CONTEÚDO VISUAL DO DASHBOARD */}
              <div className="p-5 sm:p-7 space-y-6">
                {/* LINHA DE INDICADORES PRINCIPAIS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: "Faturamento Hoje", val: "€ 4.820,50", sub: "+18,4% vs média", icon: DollarSign, color: "text-cyan-400" },
                    { label: "Vendas no Caixa", val: "142 pedidos", sub: "Liquidado em balcão", icon: Receipt, color: "text-teal-400" },
                    { label: "Margem Bruta", val: "41,8%", sub: "Meta de rentabilidade", icon: TrendingUp, color: "text-emerald-400" },
                    { label: "Alerta de Estoque", val: "3 produtos", sub: "Reposição indicada", icon: Boxes, color: "text-amber-400" },
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.04] transition-colors relative group"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span>{stat.label}</span>
                          <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                        </div>
                        <div className="text-lg sm:text-2xl font-bold text-white mt-1.5 tracking-tight font-sans">
                          {stat.val}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-cyan-400" />
                          {stat.sub}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* VISÃO COMBINADA: GRÁFICO DE VENDAS + RESUMO DO PDV */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* GRÁFICO ELEGANTE */}
                  <div className="lg:col-span-8 p-5 rounded-xl border border-white/[0.07] bg-white/[0.02] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs font-bold text-white">Desempenho Comercial Consolidado</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Vendas integradas por hora (PDV Balcão + Venda Digital)</div>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/[0.06] text-cyan-300 border border-cyan-500/20">
                        Hoje · Tempo Real
                      </span>
                    </div>

                    {/* GRÁFICO EM BARRAS DE PROPORÇÃO ELEGANTE */}
                    <div className="h-32 w-full flex items-end gap-2 pt-4">
                      {[25, 38, 45, 30, 60, 52, 75, 68, 85, 92, 110, 98, 120, 105].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <div
                            style={{ height: `${(h / 120) * 100}%` }}
                            className="w-full rounded-t-sm bg-gradient-to-t from-cyan-500/20 via-teal-400/60 to-cyan-400 group-hover:to-cyan-300 transition-all shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                          />
                          <span className="text-[8px] font-mono text-slate-400 hidden sm:inline">
                            {i + 8}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RESUMO DO CAIXA / PDV */}
                  <div className="lg:col-span-4 p-5 rounded-xl border border-white/[0.07] bg-white/[0.02] flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Frente de Caixa (PDV)</span>
                        <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          Terminal 01
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Última operação registrada</div>

                      <div className="mt-3.5 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span className="truncate pr-2">2x Dipirona 500mg</span>
                          <span className="font-mono text-slate-400">€ 25,00</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span className="truncate pr-2">1x Protetor Solar FPS 50</span>
                          <span className="font-mono text-slate-400">€ 42,50</span>
                        </div>
                        <div className="pt-2.5 border-t border-white/[0.08] flex justify-between font-bold text-white">
                          <span>Total da Venda</span>
                          <span className="font-mono text-cyan-400 text-sm">€ 67,50</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/[0.08]">
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Liquidado via Cartão/PIX
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

      {/* SEÇÃO 2: O ECOSSISTEMA VENDRA (5 PRODUTOS COM COMPOSIÇÃO PRÓPRIA) */}
      <section id="produtos" className="relative z-10 py-24 md:py-32 border-t border-white/[0.06] bg-[#060810]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Arquitetura Unificada
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-2 tracking-tight">
              Cinco pilares. Uma única base de dados.
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed">
              Cada produto resolve uma etapa fundamental da empresa, eliminando pontes frágeis entre softwares isolados.
            </p>
          </div>

          {/* SELETOR EM ABAS DOS 5 PRODUTOS COM ESTÉTICA DE VIDRO */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] max-w-2xl mx-auto mb-12 backdrop-blur-md">
            {ECOSYSTEM_PRODUCTS.map((prod) => (
              <button
                key={prod.id}
                onClick={() => setActiveProductTab(prod.id)}
                className={`flex-1 min-w-[105px] py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  activeProductTab === prod.id
                    ? "bg-white/10 text-white shadow-sm border border-white/15"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {prod.name}
              </button>
            ))}
          </div>

          {/* DEMONSTRAÇÃO EDITORIAL DO PRODUTO ATIVO */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#070A12]/80 backdrop-blur-md p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] pointer-events-none" />

            {/* LADO TEXTUAL */}
            <div className="lg:col-span-6 space-y-5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                {selectedProduct.category}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {selectedProduct.tagline}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {selectedProduct.description}
              </p>

              <div className="space-y-3 pt-2">
                {selectedProduct.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  to="/entrar"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Ver demonstração guiada do {selectedProduct.name} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* LADO VISUAL / INTERFACE SIMULADA DO PRODUTO */}
            <div className="lg:col-span-6 rounded-xl border border-white/[0.08] bg-[#0A0E18] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 text-xs">
                <div className="font-bold text-white">{selectedProduct.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {selectedProduct.metricLabel}: <span className="text-cyan-400 font-bold">{selectedProduct.metricValue}</span>
                </div>
              </div>

              {/* DEMO CONTEXTUAL DEPENDENDO DO PRODUTO */}
              {selectedProduct.id === "erp" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Fluxo de Caixa Consolidado</div>
                      <div className="text-[10px] text-slate-400">Entradas, saídas e projeção de saldo</div>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold text-sm">+ € 18.250,00</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Compras Programadas</div>
                      <div className="text-[10px] text-slate-400">Sugestão automática com base no giro</div>
                    </div>
                    <span className="font-mono text-slate-300 font-medium">4 ordens prontas</span>
                  </div>
                </div>
              )}

              {selectedProduct.id === "pos" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Leitor de Código de Barras EAN-13</div>
                      <div className="text-[10px] text-slate-400">Identificação instantânea de item e peso</div>
                    </div>
                    <span className="text-cyan-400 font-mono font-bold">18ms</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Fechamento com Divergência Zero</div>
                      <div className="text-[10px] text-slate-400">Totalização por dinheiro, cartão e PIX</div>
                    </div>
                    <span className="text-emerald-400 font-bold">Auditado</span>
                  </div>
                </div>
              )}

              {selectedProduct.id === "mobile" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Gestão Remota de Lojas</div>
                      <div className="text-[10px] text-slate-400">Faturamento e pedidos em tempo real</div>
                    </div>
                    <span className="text-cyan-400 font-semibold">Sincronizado</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Alertas Operacionais</div>
                      <div className="text-[10px] text-slate-400">Notificação de metas atingidas e estoque baixo</div>
                    </div>
                    <span className="text-slate-300 font-mono">Push ativo</span>
                  </div>
                </div>
              )}

              {selectedProduct.id === "store" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Estoque Unificado (Loja + Web)</div>
                      <div className="text-[10px] text-slate-400">Item vendido no balcão atualiza a loja virtual</div>
                    </div>
                    <span className="text-emerald-400 font-bold">100% Sincronizado</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Checkout Descomplicado</div>
                      <div className="text-[10px] text-slate-400">Pagamento online com geração direta de pedido</div>
                    </div>
                    <span className="text-cyan-400 font-semibold">Integrado</span>
                  </div>
                </div>
              )}

              {selectedProduct.id === "ai" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Motor Multiplex Integrado</div>
                      <div className="text-[10px] text-slate-400">Consultas analíticas diretamente na base de dados</div>
                    </div>
                    <span className="text-cyan-400 font-mono font-bold">Nativo</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-white/[0.025] border border-white/[0.05] flex justify-between items-center">
                    <div>
                      <div className="font-medium text-slate-200">Previsão de Ruptura de Gôndola</div>
                      <div className="text-[10px] text-slate-400">Cálculo de esgotamento pelo ritmo de vendas</div>
                    </div>
                    <span className="text-emerald-400 font-semibold">Preditivo</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: GESTÃO CENTRALIZADA (EDITORIAL COM GRANDE IMAGEM DO DASHBOARD) */}
      <section id="gestao" className="relative z-10 py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* TEXTO EDITORIAL */}
            <div className="lg:col-span-5 space-y-5 text-left">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Centralização Operacional
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                Vendas, estoque, compras e financeiro em sintonia.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                Quando uma venda é registrada no Vendra POS, a baixa no estoque é imediata, a conta a receber é alimentada
                e o relatório financeiro do Vendra ERP é atualizado instantaneamente.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  "Fim de reconciliações manuais no final do mês",
                  "Histórico transparente de cada movimento financeiro",
                  "Controle de acesso por função (caixa, estoquista, gerente)",
                  "Relatórios exportáveis em formatos corporativos",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DEMONSTRAÇÃO VISUAL DO DASHBOARD */}
            <div className="lg:col-span-7 rounded-2xl border border-white/[0.1] bg-[#070A12] p-6 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">Demonstrativo Financeiro e Operacional</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Atualização Contínua</span>
              </div>

              {/* TABELA DE OPERAÇÕES REAIS E LEGÍVEIS */}
              <div className="space-y-3.5">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Receita Bruta</div>
                    <div className="text-base font-bold text-white mt-1">€ 48.200,00</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Custo dos Produtos</div>
                    <div className="text-base font-bold text-slate-300 mt-1">€ 28.100,00</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Resultado Líquido</div>
                    <div className="text-base font-bold text-emerald-400 mt-1">€ 20.100,00</div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] overflow-hidden text-xs">
                  <div className="bg-white/[0.03] px-4 py-2.5 font-semibold text-slate-400 text-[11px] flex justify-between">
                    <span>Filial</span>
                    <span>Vendas Hoje</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {[
                      { filial: "Matriz Centro", vendas: "€ 3.110,00", status: "Caixa Aberto" },
                      { filial: "Filial Norte", vendas: "€ 1.710,50", status: "Caixa Aberto" },
                      { filial: "Loja Virtual (Store)", vendas: "€ 890,00", status: "Integrada" },
                    ].map((row, rIdx) => (
                      <div key={rIdx} className="px-4 py-3 flex justify-between items-center text-slate-300">
                        <span className="font-medium text-white">{row.filial}</span>
                        <span className="font-mono">{row.vendas}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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

      {/* SEÇÃO 4: SEGMENTOS (LAYOUT EDITORIAL COM TELAS ESPECÍFICAS) */}
      <section id="segmentos" className="relative z-10 py-24 md:py-32 border-t border-white/[0.06] bg-[#060810]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Especialização Comercial
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-2 tracking-tight">
              Uma plataforma adaptada para cada setor.
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed">
              Selecione seu segmento e veja como o VENDRA adapta seus fluxos para a realidade do seu balcão.
            </p>
          </div>

          {/* NAVEGAÇÃO DE SEGMENTOS — BOTOES COMPACTOS */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {SEGMENTS_DATA.map((seg) => (
              <button
                key={seg.id}
                onClick={() => setActiveSegmentId(seg.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeSegmentId === seg.id
                    ? "bg-white/10 text-white border border-white/20 shadow-sm"
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {seg.name}
              </button>
            ))}
          </div>

          {/* COMPOSIÇÃO EDITORIAL DO SEGMENTO ESCOLHIDO */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#070A12]/80 backdrop-blur-md p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-2xl">
            <div className="lg:col-span-5 space-y-4 text-left">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20">
                {selectedSegment.focus}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                {selectedSegment.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                {selectedSegment.description}
              </p>

              <div className="pt-2">
                <Link
                  to="/entrar"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Conhecer solução para {selectedSegment.name} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* DEMONSTRAÇÃO VISUAL DOS ATRIBUTOS ESPECÍFICOS */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {selectedSegment.attributes.map((attr, aIdx) => (
                <div key={aIdx} className="p-4.5 rounded-xl border border-white/[0.07] bg-white/[0.025] hover:bg-white/[0.04] transition-colors">
                  <div className="text-xs font-bold text-white">{attr.label}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{attr.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 5: VENDRA AI (CONVERSA VISUAL COM DEMONSTRAÇÃO CLARA) */}
      <section id="ia" className="relative z-10 py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Vendra AI Engine (Powered by Multiplex)
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-2 tracking-tight">
              A inteligência artificial que entende o seu negócio.
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed">
              Consulte seu faturamento, analise tendências de estoque e receba diagnósticos operacionais em linguagem
              natural direto da sua base de dados.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* SELEÇÃO DE PERGUNTAS DE GESTÃO */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Perguntas Frequentes de Gestão:
              </div>
              {AI_DEMO_CASES.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveAiDemoIndex(idx)}
                  className={`w-full p-4 rounded-xl text-left text-xs font-medium border transition-all flex items-center justify-between ${
                    idx === activeAiDemoIndex
                      ? "border-cyan-500/40 bg-white/[0.05] text-white shadow-sm"
                      : "border-white/[0.06] bg-white/[0.015] text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="pr-2">&ldquo;{item.question}&rdquo;</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                </button>
              ))}
            </div>

            {/* PAINEL DE DIÁLOGO E INDICADORES DA IA */}
            <div className="lg:col-span-7 rounded-2xl border border-white/[0.08] bg-[#070A12] p-6 sm:p-7 space-y-4 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    V
                  </div>
                  <span className="font-bold text-white">Vendra AI</span>
                  <span className="text-[10px] text-slate-400 font-mono">Ambiente Demonstrativo</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] text-cyan-300 border border-cyan-500/20">
                  {selectedAiDemo.tag}
                </span>
              </div>

              {/* PERGUNTA */}
              <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] text-xs text-slate-300">
                <span className="text-slate-400 font-mono mr-2">Pergunta do Gestor:</span>
                &ldquo;{selectedAiDemo.question}&rdquo;
              </div>

              {/* RESPOSTA ANALÍTICA */}
              <div className="p-4.5 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/25 space-y-3">
                <p className="text-xs text-slate-200 leading-relaxed font-normal">
                  {selectedAiDemo.answer}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-cyan-500/15">
                  {selectedAiDemo.details.map((d, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider">{d.label}</div>
                      <div className="text-xs font-bold text-cyan-300 mt-0.5 font-mono">{d.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-cyan-400" />
                Seus dados empresariais operam em ambiente seguro e isolado por tenant.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 6: MULTIPLATAFORMA (DESKTOP, PDV, TABLET E SMARTPHONE) */}
      <section id="multiplataforma" className="relative z-10 py-24 md:py-32 border-t border-white/[0.06] bg-[#060810]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Flexibilidade Operacional
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-2 tracking-tight">
              Sua empresa opera em qualquer dispositivo.
            </h2>
            <p className="text-slate-400 mt-4 text-sm sm:text-base leading-relaxed">
              Do escritório de retaguarda ao balcão de vendas e à gestão em trânsito.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
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
                  className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.035] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-cyan-400 mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-bold text-white">{d.title}</div>
                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{d.subtitle}</div>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed font-normal">{d.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEÇÃO 7: PLANOS E PREÇOS TRANSPARENTES (SEM ALEGAÇÕES INDEVIDAS) */}
      <section id="planos" className="relative z-10 py-24 md:py-32 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Transparência Comercial
            </span>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mt-2 tracking-tight">
              Planos objetivos para cada estágio do seu negócio.
            </h2>
            <p className="text-slate-400 mt-4 text-sm leading-relaxed">
              Valores mensais sem IVA. Cancele ou altere a qualquer momento sem pegadinhas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
            {APPROVED_PLANS.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-8 border flex flex-col justify-between transition-all relative ${
                  plan.featured
                    ? "border-cyan-500/40 bg-gradient-to-b from-white/[0.05] via-[#090D18] to-[#070A12] shadow-[0_0_50px_rgba(34,211,238,0.15)]"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-4xl font-bold text-white tracking-tight">{plan.price}</span>
                    <span className="text-slate-400 text-xs font-medium">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed font-normal">{plan.tagline}</p>

                  <div className="my-6 border-t border-white/[0.06]" />

                  <div className="space-y-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Recursos inclusos:
                    </div>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-white/[0.06]">
                  <Link
                    to="/entrar"
                    className={`w-full py-3 rounded-full font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 active:scale-95 ${
                      plan.featured
                        ? "bg-gradient-to-r from-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 shadow-md shadow-cyan-500/25"
                        : "border border-white/10 hover:border-white/20 bg-white/[0.03] text-white"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 8: CONVERSÃO FINAL & RODAPÉ EDITORIAL */}
      <section className="relative z-10 py-24 md:py-32 border-t border-white/[0.06] bg-[#060810]/60 relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Seu negócio merece o próximo nível.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Centralize sua operação, simplifique processos de balcão e tome decisões respaldadas em dados reais.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/entrar"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:brightness-110 text-slate-950 font-bold text-xs tracking-wide shadow-[0_0_30px_rgba(34,211,238,0.35)] transition-all flex items-center justify-center gap-2"
            >
              Começar agora <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/entrar"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.04] text-white font-medium text-xs transition-all flex items-center justify-center gap-2"
            >
              Solicitar demonstração
            </Link>
          </div>
        </div>
      </section>

      {/* RODAPÉ EDITORIAL ELEGANTE */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#04060A] py-16 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* IDENTIDADE */}
            <div className="col-span-2 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xs">
                  V
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-white text-sm">VENDRA</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">by BonaSoft</span>
                </div>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Plataforma integrada de gestão comercial, ponto de venda e inteligência artificial empresarial.
              </p>
              <div className="text-[11px] text-slate-400">
                BonaSoft Technologies. Todos os direitos reservados.
              </div>
            </div>

            {/* PRODUTOS */}
            <div className="space-y-2.5">
              <div className="font-semibold text-white text-xs">Produtos</div>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#produtos" className="hover:text-white transition-colors">Vendra ERP</a></li>
                <li><a href="#produtos" className="hover:text-white transition-colors">Vendra POS</a></li>
                <li><a href="#produtos" className="hover:text-white transition-colors">Vendra Mobile</a></li>
                <li><a href="#produtos" className="hover:text-white transition-colors">Vendra Store</a></li>
                <li><a href="#ia" className="hover:text-white transition-colors">Vendra AI</a></li>
              </ul>
            </div>

            {/* SEGMENTOS */}
            <div className="space-y-2.5">
              <div className="font-semibold text-white text-xs">Segmentos</div>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#segmentos" className="hover:text-white transition-colors">Farmácias</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Supermercados</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Moda & Vestuário</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Restaurantes</a></li>
                <li><a href="#segmentos" className="hover:text-white transition-colors">Materiais de Construção</a></li>
              </ul>
            </div>

            {/* INSTITUCIONAL */}
            <div className="space-y-2.5">
              <div className="font-semibold text-white text-xs">Institucional</div>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/entrar" className="hover:text-white transition-colors">Central de Acesso</Link></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos & Preços</a></li>
                <li><span className="text-slate-400">Termos de Uso</span></li>
                <li><span className="text-slate-400">Privacidade</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>© {new Date().getFullYear()} VENDRA by BonaSoft. Gestão comercial e tecnologia empresarial.</div>
            <div>Brasil & Espanha</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
