import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Check,
  ChevronRight,
  DollarSign,
  Play,
  Receipt,
  ShieldCheck,
  Smartphone,
  Store,
  TrendingUp,
  Laptop,
  ShoppingBag,
  Cpu,
  Layers,
} from "lucide-react";
import { CinematicCanvas3D } from "@/components/vendra/CinematicCanvas3D";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VENDRA | Seu negócio. Seu próximo nível." },
      {
        name: "description",
        content:
          "VENDRA by BonaSoft — Plataforma 3D cinematográfica de gestão comercial, vendas integradas, PDV ágil e inteligência empresarial.",
      },
      { property: "og:title", content: "VENDRA | Seu negócio. Seu próximo nível." },
      {
        property: "og:description",
        content:
          "VENDRA by BonaSoft — Uma plataforma. Todas as operações. Mais possibilidades.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

// Os 5 Pilares do Ecossistema
const ECOSYSTEM = [
  {
    id: "erp",
    name: "Vendra ERP",
    category: "Gestão Centralizada",
    headline: "O núcleo financeiro da sua empresa",
    metric: "€ 48.250",
    metricLabel: "Faturamento consolidado hoje",
    icon: Laptop,
    gradient: "from-cyan-500/20 to-teal-500/10",
  },
  {
    id: "pos",
    name: "Vendra POS",
    category: "Frente de Caixa",
    headline: "Velocidade instantânea no balcão",
    metric: "18ms",
    metricLabel: "Leitura de código de barras e balança",
    icon: Store,
    gradient: "from-teal-500/20 to-emerald-500/10",
  },
  {
    id: "mobile",
    name: "Vendra Mobile",
    category: "Gestão no Smartphone",
    headline: "Sua operação na palma da mão",
    metric: "iOS & Android",
    metricLabel: "Indicadores e aprovações em tempo real",
    icon: Smartphone,
    gradient: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: "store",
    name: "Vendra Store",
    category: "Comércio Digital",
    headline: "Vendas físicas e digitais unificadas",
    metric: "100%",
    metricLabel: "Estoque sincronizado em tempo real",
    icon: ShoppingBag,
    gradient: "from-cyan-500/20 to-blue-500/10",
  },
  {
    id: "ai",
    name: "Vendra AI",
    category: "Inteligência Empresarial",
    headline: "Decisões orientadas por dados reais",
    metric: "Multiplex",
    metricLabel: "Motor analítico nativo integrado",
    icon: Cpu,
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
];

// Planos Oficiais Aprovados
const APPROVED_PLANS = [
  {
    name: "STARTER",
    price: "€29",
    period: "/mês",
    desc: "Para lojas e comércios que precisam de gestão e PDV rápido.",
    featured: false,
    cta: "Iniciar com Starter",
    perks: [
      "1 Filial comercial ativa",
      "Vendra POS (Frente de Caixa Web) ilimitado",
      "Controle de estoque e catálogo completo",
      "Fluxo de caixa e histórico de clientes",
    ],
  },
  {
    name: "BUSINESS",
    price: "€59",
    period: "/mês",
    desc: "Para operações em expansão com múltiplos segmentos.",
    featured: true,
    badge: "MAIS ESCOLHIDO",
    cta: "Experimentar Business",
    perks: [
      "Até 3 Filiais comerciais conectadas",
      "Vendra POS Web & Desktop sincronizados",
      "Operação com múltiplos segmentos comerciais",
      "Vendra AI integrado (Motor Multiplex)",
      "Gestão avançada de lotes, grades e validade",
    ],
  },
  {
    name: "PREMIUM",
    price: "€129",
    period: "/mês",
    desc: "Para redes de lojas e operações que exigem máxima escala.",
    featured: false,
    cta: "Contratar Premium",
    perks: [
      "Filiais comerciais ilimitadas",
      "Terminais de PDV ilimitados por loja",
      "Vendra AI corporativo com consultas analíticas",
      "DRE estruturado, conciliação e centros de custo",
      "Acesso completo a APIs e suporte prioritário",
    ],
  },
];

function LandingPage() {
  const [activeSegment, setActiveSegment] = useState("farmacia");

  return (
    <div className="min-h-screen bg-[#030509] text-slate-100 font-sans antialiased selection:bg-cyan-500/25 selection:text-cyan-200 overflow-x-hidden relative">
      {/* 
        ========================================================================
        ILUMINAÇÃO DE CINEMA & AURORA ESPACIAL
        ========================================================================
      */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Glow Superior Centralizado tipo Aurora Boreal */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[95vw] max-w-[1300px] h-[650px] bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.25),rgba(6,182,212,0.18)_35%,rgba(59,130,246,0.08)_65%,transparent_80%)] blur-[140px] rounded-full" />
        
        {/* Feixes Volumétricos Suaves */}
        <div className="absolute top-[30%] left-[-10%] w-[550px] h-[550px] bg-teal-500/[0.05] blur-[170px] rounded-full" />
        <div className="absolute top-[60%] right-[-10%] w-[550px] h-[550px] bg-cyan-600/[0.05] blur-[170px] rounded-full" />
        
        {/* Micro-malha sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4.5rem_4.5rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_65%,transparent_100%)] opacity-30" />
      </div>

      {/* 
        ========================================================================
        HEADER MINIMALISTA E FLUTUANTE
        ========================================================================
      */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#030509]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(45,212,191,0.3)]">
              <div className="w-full h-full bg-[#030509] rounded-[10px] flex items-center justify-center font-black text-cyan-400 text-base">
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

          {/* NAVEGAÇÃO COMPACTA */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#ecossistema" className="hover:text-cyan-400 transition-colors">
              Ecossistema
            </a>
            <a href="#experiencia" className="hover:text-cyan-400 transition-colors">
              Plataforma
            </a>
            <a href="#segmentos" className="hover:text-cyan-400 transition-colors">
              Segmentos
            </a>
            <a href="#planos" className="hover:text-cyan-400 transition-colors">
              Planos
            </a>
          </nav>

          {/* AÇÃO PRINCIPAL */}
          <div className="flex items-center gap-3">
            <Link
              to="/entrar"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-lg transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/entrar"
              className="px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center gap-2 shadow-sm hover:border-cyan-500/40"
            >
              Demonstração <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        HERO 3D CINEMATOGRÁFICO: OBJETO 3D INTERATIVO WEBGL + TIPOGRAFIA MONUMENTAL
        ========================================================================
      */}
      <section className="relative z-10 pt-8 pb-16 md:pt-16 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* LADO ESQUERDO: APRESENTAÇÃO MONUMENTAL E LIMPA */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* PILL BADGE COM PULSO LUMINOSO */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md text-xs font-medium text-slate-200 shadow-[0_0_25px_rgba(0,0,0,0.6)] hover:border-cyan-500/35 transition-all"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                </span>
                <span className="tracking-wider uppercase text-[10px] font-extrabold text-slate-100">
                  VENDRA BY BONASOFT
                </span>
                <span className="text-white/20">|</span>
                <span className="text-slate-400 font-normal">SaaS Comercial Unificado</span>
              </motion.div>

              {/* HEADLINE PRINCIPAL IMPACTANTE */}
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-[-0.04em] text-white leading-[1.05]"
              >
                Seu negócio. <br />
                <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-white bg-clip-text text-transparent">
                  Seu próximo nível.
                </span>
              </motion.h1>

              {/* SUBTITLE OBJETIVO E DIRETO */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed font-normal"
              >
                Uma plataforma completa para conectar vendas de balcão, controle de estoque inteligente, financeiro
                e decisões estratégicas em tempo real.
              </motion.p>

              {/* BOTÕES DE AÇÃO */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="pt-2 flex flex-col sm:flex-row items-center gap-3.5"
              >
                <Link
                  to="/entrar"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-[0_0_35px_rgba(45,212,191,0.4)] transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  Começar agora <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#experiencia"
                  className="w-full sm:w-auto px-8 py-4 rounded-full border border-white/12 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.08] text-white font-semibold text-xs tracking-wide backdrop-blur-md transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
                >
                  <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                    <Play className="w-2.5 h-2.5 text-cyan-400 fill-cyan-400 ml-0.5" />
                  </span>
                  Ver plataforma
                </a>
              </motion.div>

              {/* STATUS DE OPERAÇÃO DISCRETO */}
              <div className="pt-2 flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span>4 Filiais Conectadas</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  <span>PDV Instantâneo</span>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: CANVAS 3D INTERATIVO WEBGL (REFERÊNCIA NATIONFLY) */}
            <div className="lg:col-span-6 relative flex items-center justify-center min-h-[460px] md:min-h-[580px]">
              {/* HALO RADIAL LUMINESCENTE EM VOLTA DO OBJETO 3D */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-[radial-gradient(circle,rgba(45,212,191,0.35),rgba(6,182,212,0.2)_40%,transparent_70%)] blur-[90px] rounded-full pointer-events-none" />
              
              {/* CANVAS THREE.JS REAL */}
              <div className="w-full h-full relative z-10">
                <CinematicCanvas3D />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 2: O ECOSSISTEMA VENDRA (5 CARDS 3D MINIMALISTAS - SEM POLUIÇÃO)
        ========================================================================
      */}
      <section id="ecossistema" className="relative z-10 py-24 md:py-32 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Arquitetura Unificada
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight">
              Cinco pilares. Nenhuma ponta solta.
            </h2>
            <p className="text-slate-400 mt-3 text-base sm:text-lg">
              Tudo sincronizado em uma única base de dados com resiliência total.
            </p>
          </div>

          {/* GRID BENTO DE 5 CARDS COM VISUAL DE VIDRO E DESTAQUE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ECOSYSTEM.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/[0.08] bg-[#060913]/90 hover:border-cyan-500/40 transition-all p-8 flex flex-col justify-between group hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} blur-2xl pointer-events-none`} />

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-2.5 py-1 rounded bg-white/[0.04]">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {item.headline}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-extrabold text-white tracking-tight">{item.metric}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.metricLabel}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 3: A EXPERIÊNCIA MASTER (COCKPIT CENTRAL EM VIDRO ESCURO - REFERÊNCIA CUNDO)
        ========================================================================
      */}
      <section id="experiencia" className="relative z-10 py-24 md:py-36 border-t border-white/[0.08] bg-[#04060E]/60 text-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Operação em Tempo Real
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight">
              A clareza de ter o controle absoluto.
            </h2>
            <p className="text-slate-400 mt-3 text-base sm:text-lg">
              Painel executivo, faturamento consolidado e fechamento do caixa sem conciliações manuais.
            </p>
          </div>

          {/* MOCKUP DO COCKPIT COM LUZ HALO DE FUNDO */}
          <div className="relative text-left">
            {/* LUZ HALO DE FUNDO TIPO ECLIPSE */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-[85%] max-w-3xl h-[260px] bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.35),rgba(6,182,212,0.2)_40%,transparent_75%)] blur-[90px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 rounded-3xl border border-white/[0.12] bg-[#070A14]/95 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-cyan-400/80 before:to-transparent">
              {/* BARRA SUPERIOR */}
              <div className="h-12 border-b border-white/[0.08] bg-[#050710] px-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono text-slate-300 pl-3 border-l border-white/[0.08]">
                    vendra.app · Painel Executivo
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  4 Filiais Sincronizadas
                </div>
              </div>

              {/* CONTEÚDO */}
              <div className="p-6 sm:p-10 space-y-8">
                {/* 3 GRANDES NÚMEROS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Faturamento Consolidado</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">€ 48.250,80</div>
                    <div className="text-[11px] text-emerald-400 mt-1 font-semibold">+24,6% vs ontem</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Vendas no Balcão (PDV)</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">184 pedidos</div>
                    <div className="text-[11px] text-cyan-400 mt-1 font-semibold">Tempo médio 1.2s por item</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Margem Operacional</div>
                    <div className="text-2xl sm:text-3xl font-extrabold text-white mt-2">42,4%</div>
                    <div className="text-[11px] text-teal-400 mt-1 font-semibold">Rentabilidade calculada pela IA</div>
                  </div>
                </div>

                {/* GRÁFICO MINIMALISTA DE VENDAS */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-white">Curva de Vendas por Hora</span>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300">Tempo Real</span>
                  </div>
                  <div className="h-28 w-full flex items-end gap-2 sm:gap-3 pt-4">
                    {[35, 48, 55, 42, 75, 68, 92, 85, 105, 118, 130, 120, 145, 132].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div
                          style={{ height: `${(h / 145) * 100}%` }}
                          className="w-full rounded-t-sm bg-gradient-to-t from-teal-500/20 via-cyan-400/60 to-cyan-400 group-hover:to-cyan-200 transition-all"
                        />
                        <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">{i + 8}h</span>
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
        SEÇÃO 4: SEGMENTOS EM CARDS RÁPIDOS
        ========================================================================
      */}
      <section id="segmentos" className="relative z-10 py-24 md:py-32 border-t border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Multissegmento
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight">
              Adaptado à realidade do seu balcão.
            </h2>
            <p className="text-slate-400 mt-3 text-base sm:text-lg">
              O mesmo sistema opera farmácias, mercados, lojas de roupas, restaurantes e serviços.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[
              { name: "Farmácias", tag: "Lotes & ANVISA" },
              { name: "Mercados", tag: "Balança & Pesáveis" },
              { name: "Moda & Vestuário", tag: "Grade Cor & Tamanho" },
              { name: "Restaurantes", tag: "Mesas & Comandas" },
              { name: "Beleza & Estética", tag: "Agenda & Comissões" },
              { name: "Pet Shops", tag: "Banho & Ração Granel" },
              { name: "Eletrônicos", tag: "Serial & IMEI" },
              { name: "Construção", tag: "M² & Orçamentos" },
            ].map((seg, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-cyan-500/30 transition-all"
              >
                <div className="text-sm font-bold text-white">{seg.name}</div>
                <div className="text-[11px] text-cyan-400 font-mono mt-1">{seg.tag}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 5: PLANOS OBJETIVOS (SEM POLUIÇÃO DE TEXTO)
        ========================================================================
      */}
      <section id="planos" className="relative z-10 py-24 md:py-36 border-t border-white/[0.08] bg-[#04060E]/60 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-400">
              Transparência Comercial
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-3 tracking-tight">
              Preços claros. Sem surpresas.
            </h2>
            <p className="text-slate-400 mt-3 text-base">
              Valores mensais sem IVA. Cancele ou altere a qualquer momento.
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
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed font-normal">{plan.desc}</p>

                  <div className="my-7 border-t border-white/[0.08]" />

                  <div className="space-y-3">
                    {plan.perks.map((feat, fIdx) => (
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
        CONVERSÃO FINAL & FOOTER MINIMALISTA
        ========================================================================
      */}
      <section className="relative z-10 py-24 md:py-36 border-t border-white/[0.08] text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
            Pronto para o próximo nível?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Centralize suas operações e leve inteligência de verdade para a gestão da sua empresa.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/entrar"
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-[0_0_35px_rgba(45,212,191,0.4)] transition-all flex items-center justify-center gap-2"
            >
              Iniciar agora <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-[#020408] py-14 text-xs text-slate-400 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xs">
              V
            </div>
            <div>
              <span className="font-extrabold text-white">VENDRA</span>
              <span className="text-slate-400 text-[10px] uppercase ml-2 tracking-wider">by BonaSoft</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            © {new Date().getFullYear()} VENDRA by BonaSoft. Todos os direitos reservados. Brasil & Espanha.
          </div>
        </div>
      </footer>
    </div>
  );
}
