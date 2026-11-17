import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Barcode,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  CreditCard,
  DollarSign,
  FileText,
  Layers,
  Lock,
  MessageSquare,
  Package,
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
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BonaSoft Commerce | A Plataforma SaaS Definitiva de Gestão Comercial e ERP" },
      {
        name: "description",
        content:
          "Plataforma completa de gestão empresarial, PDV, controle de estoque, financeiro e inteligência artificial integrada para farmácias, mercados, moda, restaurantes e varejo.",
      },
      { property: "og:title", content: "BonaSoft Commerce | A Plataforma SaaS Definitiva de Gestão Comercial e ERP" },
      {
        property: "og:description",
        content:
          "Gestão comercial, vendas, estoque, financeiro e IA integrados em um único ecossistema cinematográfico.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

// Segmentos comerciais do BonaSoft Commerce
const SEGMENTS = [
  {
    id: "farmacia",
    name: "Farmácias & Drogarias",
    icon: Pill,
    headline: "Rastreabilidade completa de medicamentos e controle sanitário",
    description:
      "Gestão de lotes, datas de validade, registro Anvisa, princípio ativo, dosagem, apresentações e controle rigoroso de retenção de receitas.",
    features: [
      "Controle de lote e validade automático",
      "Consulta por princípio ativo e genérico",
      "Conformidade Anvisa e receituário",
      "Integração rápida com leitor de barras EAN",
    ],
    metric: "100% em conformidade sanitária",
  },
  {
    id: "mercado",
    name: "Mercados & Supermercados",
    icon: Store,
    headline: "Frente de caixa ultra-rápida e integração direta com balanças",
    description:
      "Venda fracionada por peso (KG), automação de caixas PDV, controle de perdas, ruptura de gôndola e departamentos integrados da padaria ao açougue.",
    features: [
      "Comunicação com balanças no checkout",
      "Leitura instantânea de códigos de barras",
      "Gestão de tara e pesáveis fracionados",
      "Sangria e fechamento com divergência zero",
    ],
    metric: "Até 3x mais agilidade no checkout",
  },
  {
    id: "moda",
    name: "Moda & Vestuário",
    icon: Tag,
    headline: "Matriz de grade por tamanho, cor, coleção e variantes",
    description:
      "Organize coleções sazonais, controle de peças em cabide, variações completas de P/M/G e numerações com catálogo visual para sua loja física e online.",
    features: [
      "Grade multidimensional (Cor x Tamanho)",
      "Gestão por coleções e marcas",
      "Impressão de etiquetas de código de barras",
      "Estoque consolidado entre loja e e-commerce",
    ],
    metric: "Visibilidade total da grade em tempo real",
  },
  {
    id: "gastronomia",
    name: "Restaurantes & Gastronomia",
    icon: UtensilsCrossed,
    headline: "Comandas eletrônicas, mesas, delivery e ficha técnica",
    description:
      "Controle ágil de pedidos da cozinha ao salão, gestão de comandas, mesas, adicionais de pratos, cardápio digital e integração direta com canais de atendimento.",
    features: [
      "Controle de mesas e comandas em tempo real",
      "Disparo automático para tela da cozinha (KDS)",
      "Ficha técnica com baixa de insumos",
      "Pedidos de balcão e delivery integrados",
    ],
    metric: "Redução de 40% no tempo de preparo",
  },
  {
    id: "beleza",
    name: "Beleza & Estética",
    icon: Scissors,
    headline: "Agendamentos, serviços profissionais e controle de comissões",
    description:
      "Gestão completa de salões, barbearias e clínicas de estética: agenda compartilhada, cálculo de comissões por profissional e histórico de clientes.",
    features: [
      "Agenda integrada de procedimentos",
      "Cálculo automático de comissão",
      "Histórico de preferências do cliente",
      "Venda combinada de serviços e produtos",
    ],
    metric: "Fim das planilhas de comissão manual",
  },
  {
    id: "petshop",
    name: "Pet Shops & Veterinárias",
    icon: Dog,
    headline: "Ficha clínica, serviços de banho & tosa e produtos especializados",
    description:
      "Controle por espécie, porte, raça e idade do animal. Gerencie banho, tosa, consultas veterinárias e vendas de medicamentos e rações na mesma plataforma.",
    features: [
      "Controle por porte e espécie",
      "Agendamento de banho & tosa",
      "Venda fracionada de ração por KG",
      "Histórico de vacinas e atendimentos",
    ],
    metric: "Fidelização e recorrência de tutores",
  },
  {
    id: "eletronicos",
    name: "Eletrônicos & Informática",
    icon: Cpu,
    headline: "Rastreio por IMEI, número de série e ordens de serviço",
    description:
      "Controle unitário de cada item de alto valor pelo número de série, gestão de garantias de fábrica, ordens de serviço e assistência técnica integrada.",
    features: [
      "Registro de IMEI e número de série no checkout",
      "Ordens de serviço para manutenção",
      "Controle de prazos de garantia",
      "Emissão de laudos e termos de entrega",
    ],
    metric: "Segurança total contra extravios",
  },
  {
    id: "construcao",
    name: "Materiais de Construção",
    icon: Wrench,
    headline: "Múltiplas unidades (M², M³, KG), orçamentos e frete",
    description:
      "Suporte a venda fracionada de areia, cimento, pisos e tintas. Emissão de orçamentos complexos, controle de entregas parceladas e cálculo de transporte.",
    features: [
      "Conversão de unidades (M², M³, Barras)",
      "Geração de orçamentos de grande porte",
      "Controle de entregas agendadas em obras",
      "Preços diferenciados no atacado e varejo",
    ],
    metric: "Orçamentos rápidos com margem garantida",
  },
];

// Planos aprovados
const PLANS = [
  {
    name: "STARTER",
    price: "€29",
    period: "/mês",
    description: "Ideal para pequenos comércios, lojas individuais e autônomos que buscam profissionalizar sua operação.",
    badge: null,
    highlight: false,
    features: [
      "1 Filial comercial ativa",
      "Frente de Caixa (PDV Web) ilimitado",
      "Catálogo unificado e controle de estoque",
      "Gestão financeira básica e fluxo de caixa",
      "Cadastro ilimitado de clientes e produtos",
      "Suporte padrão por e-mail e chamados",
    ],
    cta: "Iniciar com Starter",
    link: "/entrar",
  },
  {
    name: "BUSINESS",
    price: "€59",
    period: "/mês",
    description: "A escolha favorita para empresas em expansão, comércios consolidados e lojas multissegmento.",
    badge: "MAIS ESCOLHIDO",
    highlight: true,
    features: [
      "Até 3 Filiais comerciais conectadas",
      "PDV Web e PDV Desktop com sincronização em tempo real",
      "Suporte a Múltiplos Segmentos simultâneos",
      "Motor Multiplex AI integrado ao ERP",
      "Controle avançado de lotes, validade e grades",
      "Integrações comerciais (WhatsApp e Redes)",
      "Suporte prioritário via chat em tempo real",
    ],
    cta: "Experimentar Business",
    link: "/entrar",
  },
  {
    name: "PREMIUM",
    price: "€129",
    period: "/mês",
    description: "Para redes de lojas, supermercados, franquias e operações exigentes de alta volumetria.",
    badge: "COMPLETO & CORPORATIVO",
    highlight: false,
    features: [
      "Filiais comerciais ilimitadas",
      "Terminais de PDV ilimitados por loja",
      "Treinamento personalizado do Multiplex AI com documentos da empresa",
      "DRE consolidado, centro de custos e conciliação bancária",
      "Relatórios executivos e BI preditivo",
      "Acesso completo a APIs e Webhooks",
      "Gerente de conta dedicado e SLA de atendimento 24/7",
    ],
    cta: "Contratar Premium",
    link: "/entrar",
  },
];

// Perguntas reais da IA
const AI_QUERIES = [
  {
    query: "Quanto minha empresa vendeu hoje?",
    response:
      "Hoje foram registradas 142 vendas somando € 4.820,50, um crescimento de +18,4% em relação a ontem. A filial Matriz liderou com € 3.110,00 e a margem bruta consolidada está em 42,1%.",
    kpi: "€ 4.820,50 (+18.4%)",
    tag: "Financeiro & Vendas",
  },
  {
    query: "Quais produtos estão próximos de acabar?",
    response:
      "Identifiquei 3 itens abaixo do estoque mínimo: Amoxicilina 500mg (4 un restantes), Queijo Prato Fatiado (1.2 kg) e Camisa Linho M (1 un). Deseja gerar o pedido de compra para os fornecedores habituais?",
    kpi: "3 produtos críticos",
    tag: "Estoque & Compras",
  },
  {
    query: "Qual filial apresenta melhor desempenho este mês?",
    response:
      "A Filial Centro alcançou 114% da meta mensal com faturamento de € 68.400,00 e ticket médio de € 54,20, superando a Matriz em rentabilidade líquida.",
    kpi: "Filial Centro (+14% da meta)",
    tag: "Performance & Lojas",
  },
  {
    query: "Quais contas a pagar vencem esta semana?",
    response:
      "Existem 4 duplicatas com vencimento até sexta-feira totalizando € 3.250,00. O saldo em caixa projetado cobrirá 100% das obrigações com folga de € 12.800,00.",
    kpi: "€ 3.250,00 (Fluxo 100% seguro)",
    tag: "Fluxo de Caixa",
  },
];

function LandingPage() {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [activeAiQueryIndex, setActiveAiQueryIndex] = useState(0);

  const activeSegment = SEGMENTS[activeSegmentIndex];
  const activeAiQuery = AI_QUERIES[activeAiQueryIndex];

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200 font-sans antialiased overflow-x-hidden">
      {/* AMBIENT BACKGROUND GLOWS (CINEMATIC LIGHTING) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glow ciano/turquesa superior */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent blur-[140px] rounded-full" />
        {/* Glow azul-marinho profundo lateral */}
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full" />
        {/* Glow esmeralda inferior */}
        <div className="absolute top-[75%] -right-[10%] w-[700px] h-[600px] bg-emerald-600/10 blur-[160px] rounded-full" />
        {/* Grid de perspectiva discreto no fundo */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      {/* NAVBAR FIXA GLASSMORPHIC */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#05070D]/80 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGOTIPO BONASOFT COMMERCE */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
              <div className="w-full h-full bg-[#070A12] rounded-[11px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                BonaSoft <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-black">Commerce</span>
              </span>
              <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-semibold">
                Plataforma SaaS & ERP
              </span>
            </div>
          </Link>

          {/* NAVEGAÇÃO DESKTOP */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#ecossistema" className="hover:text-emerald-400 transition-colors">
              Ecossistema
            </a>
            <a href="#segmentos" className="hover:text-emerald-400 transition-colors">
              Segmentos
            </a>
            <a href="#ia" className="hover:text-emerald-400 transition-colors">
              Inteligência Artificial
            </a>
            <a href="#multiplataforma" className="hover:text-emerald-400 transition-colors">
              Plataformas
            </a>
            <a href="#planos" className="hover:text-emerald-400 transition-colors">
              Planos
            </a>
          </nav>

          {/* AÇÕES DA NAVBAR */}
          <div className="flex items-center gap-3">
            <Link
              to="/entrar"
              className="text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/entrar"
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-xs sm:text-sm font-bold text-white rounded-xl group bg-gradient-to-r from-emerald-500 to-cyan-500 group-hover:from-emerald-400 group-hover:to-cyan-400 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300 active:scale-95"
            >
              <span className="relative px-4 py-2 transition-all ease-in duration-75 bg-[#05070D] rounded-[10px] group-hover:bg-transparent flex items-center gap-1.5">
                Acessar Plataforma <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION CINEMATOGRÁFICA */}
      <section className="relative z-10 pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* BADGE DE LANÇAMENTO */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-8 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Ecossistema Comercial & ERP de Alta Performance
          </motion.div>

          {/* HEADLINE PRINCIPAL IMPACTANTE */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.08]"
          >
            Seu negócio. <br className="hidden sm:inline" />
            Uma plataforma. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Controle total.
            </span>
          </motion.h1>

          {/* SUBHEADLINE */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-normal"
          >
            Gestão comercial, vendas, estoque, financeiro e inteligência artificial integrados em um único ecossistema.
            Tudo o que sua empresa precisa para operar, crescer e vender mais.
          </motion.p>

          {/* BOTÕES DE CHAMADA DE AÇÃO (CTAs) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#ecossistema"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2 group active:scale-95"
            >
              Conhecer a plataforma <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>

            <Link
              to="/entrar"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 hover:border-emerald-500/40 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-md active:scale-95"
            >
              Solicitar demonstração
            </Link>
          </motion.div>

          {/* MOCKUP CINEMATOGRÁFICO DO SOFTWARE (CENTRAL PIECE) */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 sm:mt-24 relative max-w-6xl mx-auto"
          >
            {/* LUZ DE FUNDO EM VOLTA DO MOCKUP */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

            {/* MOCKUP PRINCIPAL DO ERP */}
            <div className="relative rounded-2xl border border-white/15 bg-[#090D18]/90 shadow-2xl backdrop-blur-2xl overflow-hidden text-left">
              {/* BARRA SUPERIOR macOS / NAVEGADOR */}
              <div className="h-11 border-b border-white/[0.08] bg-[#070A13] px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs text-slate-400 font-mono hidden sm:inline">
                    bonasoft-commerce.app • Painel Executivo Consolidado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Sincronizado • 4 Lojas Conectadas
                  </span>
                </div>
              </div>

              {/* CORPO DO MOCKUP */}
              <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* LINHA DE INDICADORES / METRICAS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: "Vendas Hoje", value: "€ 4.820,50", diff: "+18.4%", icon: DollarSign },
                    { label: "Pedidos Faturados", value: "142 vendas", diff: "100% liquidados", icon: Receipt },
                    { label: "Margem Bruta Média", value: "41.8%", diff: "+2.3% vs meta", icon: TrendingUp },
                    { label: "Estoque em Alerta", value: "3 produtos", diff: "Reposição gerada", icon: Boxes },
                  ].map((kpi, idx) => {
                    const Icon = kpi.icon;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 sm:p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-xs">
                          <span>{kpi.label}</span>
                          <Icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-lg sm:text-2xl font-black text-white mt-1.5">{kpi.value}</div>
                        <div className="text-[11px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {kpi.diff}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* GRÁFICO E DETALHAMENTO DE VENDAS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* CURVA DE FATURAMENTO */}
                  <div className="lg:col-span-2 p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                          Fluxo de Vendas em Tempo Real
                        </div>
                        <div className="text-lg font-bold text-white">Consolidado Multicanal (PDV + Loja Virtual)</div>
                      </div>
                      <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                        Pico às 14:30
                      </span>
                    </div>

                    {/* GRÁFICO VETORIAL ESTILIZADO */}
                    <div className="h-40 w-full flex items-end gap-2 pt-6 pb-2">
                      {[35, 42, 38, 65, 50, 72, 85, 60, 95, 88, 110, 102, 125, 140].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                          <div
                            style={{ height: `${h}px` }}
                            className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500/20 via-teal-500/60 to-cyan-400 group-hover:from-emerald-400 group-hover:to-cyan-300 transition-all shadow-xs shadow-cyan-500/20"
                          />
                          <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">
                            {i + 8}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MINI CARD DO PDV EM TEMPO REAL */}
                  <div className="p-4 sm:p-5 rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Store className="w-3.5 h-3.5" /> PDV Balcão Ativo
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Terminal 01</span>
                      </div>
                      <div className="text-sm font-bold text-white">Última Venda Emitida</div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-300 border-b border-white/[0.05] pb-1.5">
                          <span>2x Dipirona 500mg</span>
                          <span className="font-mono">€ 25,00</span>
                        </div>
                        <div className="flex justify-between text-slate-300 border-b border-white/[0.05] pb-1.5">
                          <span>1x Protetor Solar FPS 50</span>
                          <span className="font-mono">€ 42,50</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold pt-1">
                          <span>Total Liquidado</span>
                          <span className="font-mono">€ 67,50</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pago via Cartão / PIX
                      </span>
                      <span className="font-mono">Cupom #8492</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SATELLITE FLOATING CARDS (EFEITO DE PROFUNDIDADE) */}
            <div className="hidden md:block absolute -bottom-8 -left-6 max-w-xs p-4 rounded-xl border border-emerald-500/30 bg-[#070A14]/95 shadow-2xl backdrop-blur-xl text-left animate-bounce duration-1000">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Barcode className="w-4 h-4" /> Leitor de Código de Barras
              </div>
              <p className="text-xs text-slate-300 mt-1">
                EAN-13 reconhecido em 18ms. Produto adicionado automaticamente ao carrinho do PDV.
              </p>
            </div>

            <div className="hidden md:block absolute -top-6 -right-6 max-w-sm p-4 rounded-xl border border-cyan-500/30 bg-[#070A14]/95 shadow-2xl backdrop-blur-xl text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Cpu className="w-4 h-4" /> Multiplex AI Engine
              </div>
              <p className="text-xs text-slate-300 mt-1">
                &ldquo;Margem do setor de Farmácia subiu 4.2% nesta semana. Recomendo repor 32 unidades do lote #819.&rdquo;
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. SEÇÃO: UM ECOSSISTEMA COMPLETO */}
      <section id="ecossistema" className="relative z-10 py-24 border-t border-white/[0.08] bg-[#070A14]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Unificação Absoluta
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 tracking-tight">
              Tudo conectado. Tudo sob controle.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg">
              Elimine a necessidade de múltiplos softwares desconexos. O BonaSoft Commerce integra cada engrenagem da
              sua empresa em um único ecossistema fluido.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                title: "Gestão Empresarial & ERP",
                desc: "Emissão de documentos, controle fiscal, cadastro universal de filiais e conformidade legal.",
                icon: Building2,
              },
              {
                title: "Frente de Caixa (PDV)",
                desc: "Checkout veloz para balcão, teclado, touchscreen e leitor de código de barras sem travas.",
                icon: Store,
              },
              {
                title: "Controle de Estoque & Lotes",
                desc: "Rastreabilidade de lote, datas de validade, balança, múltiplos depósitos e alerta de ruptura.",
                icon: Boxes,
              },
              {
                title: "Gestão Financeira & DRE",
                desc: "Fluxo de caixa em tempo real, contas a pagar e receber, centros de custo e conciliação bancária.",
                icon: DollarSign,
              },
              {
                title: "Compras & Fornecedores",
                desc: "Pedidos de compra automatizados conforme o giro do produto e histórico de cotações.",
                icon: Truck,
              },
              {
                title: "Clientes & CRM Ativo",
                desc: "Histórico completo de compras por cliente, ticket médio, hábitos de consumo e fidelidade.",
                icon: Users,
              },
              {
                title: "E-commerce & Catálogo",
                desc: "Catálogo online unificado com estoque em tempo real entre suas lojas físicas e a internet.",
                icon: ShoppingBag,
              },
              {
                title: "Motor de IA Multiplex",
                desc: "Inteligência analítica nativa que responde perguntas empresariais com base nos seus dados reais.",
                icon: Cpu,
              },
            ].map((module, idx) => {
              const Icon = module.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mt-4 group-hover:text-emerald-300 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed">{module.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center text-xs font-semibold text-emerald-400 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Saiba mais <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO: UMA PLATAFORMA PARA CADA SEGMENTO */}
      <section id="segmentos" className="relative z-10 py-24 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Especialização Profunda
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 tracking-tight">
              Uma plataforma. Feita para o seu segmento.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg">
              Sem adaptações improvisadas. O BonaSoft Commerce adapta seus campos, telas e regras de negócio para as
              necessidades específicas do seu setor.
            </p>
          </div>

          {/* ABAS / SELETOR DOS SEGMENTOS */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {SEGMENTS.map((seg, idx) => {
              const Icon = seg.icon;
              const active = idx === activeSegmentIndex;
              return (
                <button
                  key={seg.id}
                  onClick={() => setActiveSegmentIndex(idx)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    active
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 scale-105"
                      : "border border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05] hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {seg.name}
                </button>
              );
            })}
          </div>

          {/* SHOWCASE DETALHADO DO SEGMENTO SELECIONADO */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSegment.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-6 sm:p-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {activeSegment.metric}
                </div>

                <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                  {activeSegment.headline}
                </h3>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {activeSegment.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {activeSegment.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link
                    to="/entrar"
                    className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Ver demonstração para {activeSegment.name} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* CARD VISUAL SIMULANDO A OPERAÇÃO REAL */}
              <div className="lg:col-span-6 p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#070A14] space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div className="flex items-center gap-2">
                    <activeSegment.icon className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm text-white">{activeSegment.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">Ambiente Operacional</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Atributos Customizados do Setor</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Validados rigorosamente no catálogo e PDV</div>
                    </div>
                    <span className="text-emerald-400 font-bold">Ativo</span>
                  </div>

                  <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-200">Compatibilidade Multissegmento</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Opere mercado, açougue e padaria na mesma empresa</div>
                    </div>
                    <span className="text-emerald-400 font-bold">Unificado</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  {activeSegment.name} opera com todas as capacidades do BonaSoft Commerce ativadas.
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 6. SEÇÃO: INTELIGÊNCIA ARTIFICIAL INTEGRADA */}
      <section id="ia" className="relative z-10 py-24 border-t border-white/[0.08] bg-[#070A14]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Motor Multiplex AI
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 tracking-tight">
              Seu negócio ganha um novo nível de inteligência.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg">
              A inteligência artificial não é um robô isolado. No BonaSoft Commerce, ela é o cérebro analítico do seu
              ERP, transformando dados brutos de estoque, vendas e finanças em respostas e decisões imediatas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* SELETOR DE PERGUNTAS DA IA */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Experimente perguntas empresariais reais:
              </div>

              {AI_QUERIES.map((item, idx) => {
                const active = idx === activeAiQueryIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveAiQueryIndex(idx)}
                    className={`w-full p-4 rounded-xl text-left border transition-all text-xs sm:text-sm font-semibold flex items-center justify-between ${
                      active
                        ? "border-emerald-500/50 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10"
                        : "border-white/[0.08] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                    }`}
                  >
                    <span>&ldquo;{item.query}&rdquo;</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${active ? "translate-x-1 text-emerald-400" : ""}`} />
                  </button>
                );
              })}
            </div>

            {/* PAINEL DE RESPOSTA DA IA */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeAiQueryIndex}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-[#090D18] shadow-2xl space-y-5"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Multiplex Business Intelligence</div>
                        <div className="text-[10px] text-muted-foreground font-mono">Análise Direta do Banco de Dados</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {activeAiQuery.tag}
                    </span>
                  </div>

                  {/* PROMPT DO OPERADOR */}
                  <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs font-semibold text-slate-300">
                    <span className="text-slate-500 font-mono mr-2">Pergunta:</span>
                    &ldquo;{activeAiQuery.query}&rdquo;
                  </div>

                  {/* RESPOSTA DA IA */}
                  <div className="space-y-3">
                    <div className="text-sm text-slate-200 leading-relaxed">
                      {activeAiQuery.response}
                    </div>

                    <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Indicador Identificado:</span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">{activeAiQuery.kpi}</span>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Seus dados nunca saem da sua empresa e nunca são utilizados para treinar modelos públicos.
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 7. SEÇÃO: FUNCIONA EM TODOS OS AMBIENTES (MULTIPLATAFORMA) */}
      <section id="multiplataforma" className="relative z-10 py-24 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Onipresença Operacional
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 tracking-tight">
              Funciona em todos os ambientes da sua empresa.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg">
              No balcão físico, no computador do escritório, no tablet ou no smartphone do gestor.
              O BonaSoft Commerce acompanha o ritmo da sua operação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Painel Web & Retaguarda",
                subtitle: "Navegadores Desktop e Laptops",
                desc: "Gestão completa de compras, estoque, cadastros, relatórios financeiros, DRE e configurações multiempresa.",
                icon: LaptopIcon,
                status: "Disponível na Web",
              },
              {
                title: "Frente de Caixa (PDV)",
                desc: "Frente de caixa rápida com leitor de código de barras, telas touchscreen e fechamento de caixa integrado.",
                subtitle: "PDV Web & PDV Desktop",
                icon: Store,
                status: "Disponível na Web & Desktop",
              },
              {
                title: "Aplicativo Mobile Gestor",
                subtitle: "iOS & Android",
                desc: "Acompanhe faturamento em tempo real, aprove compras, consulte preços e receba alertas da IA na palma da mão.",
                icon: Smartphone,
                status: "Em Homologação",
              },
            ].map((device, idx) => {
              const Icon = device.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/30 transition-all text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-white/[0.05] text-slate-300 border border-white/10">
                      {device.status}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-3">{device.title}</h3>
                    <div className="text-xs font-mono text-emerald-400 mt-1">{device.subtitle}</div>
                    <p className="text-sm text-slate-400 mt-3 leading-relaxed">{device.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. SEÇÃO: PLANOS E PREÇOS TRANSPARENTES */}
      <section id="planos" className="relative z-10 py-24 border-t border-white/[0.08] bg-[#070A14]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Investimento Transparente
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mt-2 tracking-tight">
              Planos sem pegadinhas. Feitos para crescer.
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg">
              Valores mensais sem IVA. Cancele ou altere seu plano quando desejar, com total liberdade comercial.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {PLANS.map((plan, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${
                  plan.highlight
                    ? "border-emerald-500/60 bg-gradient-to-b from-emerald-500/10 via-[#090D18] to-[#070A12] shadow-2xl shadow-emerald-500/10 scale-105 z-10"
                    : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm font-semibold">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">{plan.description}</p>

                  <div className="my-6 border-t border-white/[0.08]" />

                  <div className="space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Incluso no plano:
                    </div>
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.08]">
                  <Link
                    to={plan.link}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
                      plan.highlight
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30"
                        : "border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] text-white"
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

      {/* 9. SEÇÃO FINAL: CONVERSÃO */}
      <section className="relative z-10 py-24 sm:py-32 border-t border-white/[0.08] overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-teal-500/10 blur-3xl pointer-events-none" />

          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Prepare sua empresa para o próximo nível.
          </h2>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal">
            Centralize sua operação, simplifique sua gestão e transforme informações em decisões melhores.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/entrar"
              className="w-full sm:w-auto px-9 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
            >
              Começar agora <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/entrar"
              className="w-full sm:w-auto px-9 py-4 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              Solicitar demonstração
            </Link>
          </div>
        </div>
      </section>

      {/* 10. RODAPÉ INSTITUCIONAL PROFISSONAL */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#04060A] py-16 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* BRAND */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base text-white">
                  BonaSoft <span className="text-emerald-400">Commerce</span>
                </span>
              </div>
              <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
                Plataforma SaaS de Gestão Comercial e ERP Multissegmento, com motor central de inteligência artificial
                Multiplex.
              </p>
              <div className="text-[11px] text-slate-500">
                BonaSoft Technologies Ltd. Todos os direitos reservados.
              </div>
            </div>

            {/* COLUNA 1: PLATAFORMA */}
            <div className="space-y-3">
              <div className="font-bold text-slate-200 text-xs uppercase tracking-wider">Plataforma</div>
              <ul className="space-y-2">
                <li><a href="#ecossistema" className="hover:text-emerald-400 transition-colors">Visão Geral</a></li>
                <li><Link to="/pdv" className="hover:text-emerald-400 transition-colors">Frente de Caixa (PDV)</Link></li>
                <li><a href="#ecossistema" className="hover:text-emerald-400 transition-colors">Controle de Estoque</a></li>
                <li><a href="#ecossistema" className="hover:text-emerald-400 transition-colors">Gestão Financeira</a></li>
                <li><a href="#ia" className="hover:text-emerald-400 transition-colors">Motor Multiplex AI</a></li>
              </ul>
            </div>

            {/* COLUNA 2: SEGMENTOS */}
            <div className="space-y-3">
              <div className="font-bold text-slate-200 text-xs uppercase tracking-wider">Segmentos</div>
              <ul className="space-y-2">
                <li><a href="#segmentos" className="hover:text-emerald-400 transition-colors">Farmácias</a></li>
                <li><a href="#segmentos" className="hover:text-emerald-400 transition-colors">Supermercados</a></li>
                <li><a href="#segmentos" className="hover:text-emerald-400 transition-colors">Moda & Vestuário</a></li>
                <li><a href="#segmentos" className="hover:text-emerald-400 transition-colors">Restaurantes</a></li>
                <li><a href="#segmentos" className="hover:text-emerald-400 transition-colors">Varejo Geral</a></li>
              </ul>
            </div>

            {/* COLUNA 3: INSTITUCIONAL & LEGAL */}
            <div className="space-y-3">
              <div className="font-bold text-slate-200 text-xs uppercase tracking-wider">Legal & Suporte</div>
              <ul className="space-y-2">
                <li><Link to="/entrar" className="hover:text-emerald-400 transition-colors">Central de Ajuda</Link></li>
                <li><a href="#planos" className="hover:text-emerald-400 transition-colors">Planos & Preços</a></li>
                <li><span className="text-slate-500">Termos de Serviço</span></li>
                <li><span className="text-slate-500">Política de Privacidade</span></li>
                <li><span className="text-slate-500">Conformidade GDPR / LGPD</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>© {new Date().getFullYear()} BonaSoft Commerce. Desenvolvido para alta escala comercial.</div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> Segurança Bancária 256-bit
              </span>
              <span>Disponibilidade 99.98%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper icon
function LaptopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
    </svg>
  );
}
