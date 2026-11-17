import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Laptop,
  Store,
  Smartphone,
  ShoppingBag,
  Cpu,
  Check,
} from "lucide-react";
import { CinematicCanvas3D } from "@/components/vendra/CinematicCanvas3D";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VENDRA | Seu negócio merece mais." },
      {
        name: "description",
        content:
          "VENDRA by BonaSoft — Plataforma cinematográfica de gestão comercial, vendas integradas, PDV e inteligência empresarial.",
      },
      { property: "og:title", content: "VENDRA | Seu negócio merece mais." },
      {
        property: "og:description",
        content:
          "Uma plataforma para transformar a gestão da sua empresa. by BonaSoft.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

// Segmentos comerciais em movimento com fotografia de alto padrão
const COMMERCIAL_SECTORS = [
  {
    id: "farmacia",
    name: "Farmácias",
    title: "Farmácias & Drogarias",
    narrative: "Rastreabilidade completa de lotes, datas de validade e controle rigoroso de receituário.",
    kpi: "Rastreio Unitário · 100% Auditado",
    image:
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: "mercado",
    name: "Supermercados",
    title: "Mercados & Supermercados",
    narrative: "Velocidade absoluta no checkout, integração com balança e controle de múltiplos setores.",
    kpi: "Operação Rápida · < 1.5s por Item",
    image:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: "moda",
    name: "Moda & Roupas",
    title: "Moda & Vestuário",
    narrative: "Gestão inteligente de grade multidimensional (Cor x Tamanho) e controle de coleções.",
    kpi: "Grade Matricial · Estoque Unificado",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: "gastronomia",
    name: "Restaurantes",
    title: "Restaurantes & Bares",
    narrative: "Mesas, comandas eletrônicas sincronizadas e baixa automática de estoque por ficha técnica.",
    kpi: "Operação de Salão · Zero Fricção",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: "beleza",
    name: "Beleza & Estética",
    title: "Salões & Clínicas de Estética",
    narrative: "Agenda integrada por profissional, cálculo automático de comissões e histórico clínico.",
    kpi: "Comissão Automática · Gestão de Agenda",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: "petshop",
    name: "Pet Shops",
    title: "Pet Shops & Veterinárias",
    narrative: "Fila de banho e tosa, perfil do animal, ração fracionada por peso e controle clínico.",
    kpi: "Histórico do Pet · Venda Fracionada",
    image:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: "eletronicos",
    name: "Eletrônicos",
    title: "Eletrônicos & Assistência",
    narrative: "Rastreamento obrigatório por Serial/IMEI no caixa, ordens de serviço e garantias.",
    kpi: "Segurança por IMEI · Ordens de Serviço",
    image:
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1920&q=85",
  },
  {
    id: "construcao",
    name: "Construção",
    title: "Materiais de Construção",
    narrative: "Cálculo preciso por m² e m³, emissão rápida de orçamentos e entregas programadas em obra.",
    kpi: "Cálculo Fracionado · Orçamentos Ágeis",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1920&q=85",
  },
];

// 5 Produtos do Ecossistema
const ECOSYSTEM_ITEMS = [
  {
    name: "Vendra ERP",
    desc: "O núcleo central de retaguarda, finanças consolidadas, compras e relatórios de filiais.",
    icon: Laptop,
  },
  {
    name: "Vendra POS",
    desc: "Frente de caixa ágil para balcão, leitor de código de barras e balança sem latência.",
    icon: Store,
  },
  {
    name: "Vendra Mobile",
    desc: "Acompanhamento gerencial do faturamento e aprovações estratégicas na palma da mão.",
    icon: Smartphone,
  },
  {
    name: "Vendra Store",
    desc: "Canal digital omnichannel sincronizado em tempo real com o estoque físico da loja.",
    icon: ShoppingBag,
  },
  {
    name: "Vendra AI",
    desc: "Motor de inteligência artificial analítico integrado para diagnósticos empresariais.",
    icon: Cpu,
  },
];

// 3 Preços Oficiais Aprovados
const APPROVED_PRICING = [
  {
    name: "STARTER",
    price: "€29",
    period: "/mês",
    desc: "Para lojas e operações comerciais individuais que buscam precisão e velocidade.",
    featured: false,
    perks: [
      "1 Filial comercial ativa",
      "Vendra POS (Frente de Caixa) ilimitado",
      "Controle de estoque e catálogo unificado",
      "Gestão financeira de fluxo de caixa",
    ],
  },
  {
    name: "BUSINESS",
    price: "€59",
    period: "/mês",
    desc: "Para empresas em expansão que operam com múltiplos segmentos simultâneos.",
    featured: true,
    badge: "MAIS ESCOLHIDO",
    perks: [
      "Até 3 Filiais comerciais conectadas",
      "Vendra POS Web & Desktop sincronizados",
      "Operação com múltiplos segmentos ativos",
      "Vendra AI integrado (Motor Multiplex)",
      "Controle de lotes, grades matriciais e balança",
    ],
  },
  {
    name: "PREMIUM",
    price: "€129",
    period: "/mês",
    desc: "Para redes comerciais e supermercados que exigem alta escala e máxima governança.",
    featured: false,
    perks: [
      "Filiais comerciais ilimitadas",
      "Terminais de PDV ilimitados por loja",
      "Vendra AI corporativo com análises profundas",
      "DRE estruturado e centros de custo",
      "Acesso completo a APIs e suporte prioritário",
    ],
  },
];

function LandingPage() {
  const [activeSectorId, setActiveSectorId] = useState("farmacia");
  const selectedSector =
    COMMERCIAL_SECTORS.find((s) => s.id === activeSectorId) || COMMERCIAL_SECTORS[0];

  return (
    <div className="min-h-screen w-full bg-[#000000] text-slate-100 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200 overflow-x-hidden flex flex-col items-center">
      
      {/* 
        ========================================================================
        NAVBAR MINIMALISTA & ULTRA-FINA
        ========================================================================
      */}
      <header className="fixed top-0 inset-x-0 z-50 h-16 border-b border-white/[0.08] bg-[#05060b]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between w-full">
          {/* IDENTIDADE VENDRA */}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-black text-lg tracking-[0.2em] text-white">
              VENDRA
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase pl-2.5 border-l border-white/15">
              by BonaSoft
            </span>
          </Link>

          {/* LINKS DE NAVEGAÇÃO */}
          <nav className="hidden md:flex items-center gap-9 text-xs font-semibold text-slate-300">
            <a href="#revelacao" className="hover:text-white transition-colors">
              Plataforma
            </a>
            <a href="#comercio" className="hover:text-white transition-colors">
              Segmentos
            </a>
            <a href="#inteligencia" className="hover:text-white transition-colors">
              Vendra AI
            </a>
            <a href="#ecossistema" className="hover:text-white transition-colors">
              Ecossistema
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Planos
            </a>
          </nav>

          {/* AÇÕES DISCRETAS */}
          <div className="flex items-center gap-4">
            <Link
              to="/entrar"
              className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/entrar"
              className="px-4 py-2 rounded-full border border-violet-500/30 hover:border-violet-400/60 bg-violet-500/[0.1] hover:bg-violet-500/[0.2] text-white text-xs font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(139,92,246,0.25)]"
            >
              Solicitar demonstração
            </Link>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        SEÇÃO 1 — HERO CINEMATOGRÁFICO: 2 COLUNAS COM ESCULTURA 3D FLUIDA (ESTILO NATIONFLY)
        ========================================================================
      */}
      <section className="relative min-h-screen w-full flex items-center justify-center pt-24 pb-16 lg:py-0 overflow-hidden bg-[#05060b]">
        {/* LUZES DE ESTÚDIO AMBIENTE SUAVES */}
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(139,92,246,0.15),transparent_70%)] blur-[140px] pointer-events-none z-0" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[550px] h-[550px] bg-[radial-gradient(circle,rgba(6,182,212,0.14),transparent_65%)] blur-[130px] pointer-events-none z-0" />

        {/* GRADE SPLIT HERO: TEXTO À ESQUERDA + 3D PROTAGONISTA À DIREITA */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-6 py-8">
          
          {/* COLUNA ESQUERDA: IDENTIDADE, HEADLINE E AÇÕES */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-7 z-10">
            {/* PILL BADGE ESTILO NATIONFLY */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/[0.08] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_#a855f7]" />
              <span className="text-xs font-semibold tracking-wide text-violet-200">
                VENDRA by BonaSoft — Gestão Comercial Inteligente
              </span>
            </div>

            {/* HEADLINE MONUMENTAL */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-[-0.04em] text-white leading-[1.03]">
              Seu Negócio. <br />
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Seu Próximo Nível.
              </span>
            </h1>

            {/* SUBTITLE */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-xl font-normal leading-relaxed">
              Uma plataforma unificada para transformar a gestão da sua empresa: vendas multicanal, frente de caixa de alta velocidade, estoque inteligente e operação em escala.
            </p>

            {/* BOTÕES DE AÇÃO ESTILO NATIONFLY */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <a
                href="#revelacao"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-[0_0_35px_rgba(139,92,246,0.45)] text-center cursor-pointer"
              >
                Conhecer a plataforma
              </a>

              <Link
                to="/entrar"
                className="px-7 py-4 rounded-full border border-white/15 hover:border-white/30 bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold text-xs tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2.5"
              >
                <span>Solicitar demonstração</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </Link>
            </div>
          </div>

          {/* COLUNA DIREITA: CENA 3D FLUIDA METÁLICA (PROTAGONISTA NATIONFLY) */}
          <div className="lg:col-span-5 relative w-full h-[400px] sm:h-[480px] lg:h-[580px] flex items-center justify-center z-10">
            <CinematicCanvas3D />
          </div>
        </div>

        {/* INDICADOR DE ROLAGEM MINIMALISTA */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none opacity-40">
          <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400">Scroll</span>
          <div className="w-px h-5 bg-gradient-to-b from-white to-transparent" />
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 2 — REVELAÇÃO DO PRODUTO: DASHBOARD EM VIDRO ESCURO COM AURA DE ESTÚDIO (ESTILO NEXUSAI & CUNDO)
        ========================================================================
      */}
      <section id="revelacao" className="relative w-full py-28 md:py-36 border-t border-white/[0.08] bg-[#030408] flex flex-col items-center overflow-hidden">
        {/* AURA GLOW ESTILO CUNDO NO TOPO DO DASHBOARD */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(circle,rgba(16,185,129,0.14),transparent_65%)] blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 text-center space-y-12 w-full relative z-10">
          {/* TEXTO CURTO & AUTORITÁRIO */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-mono tracking-[0.25em] uppercase text-emerald-400 font-bold">
              Vendra ERP
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Toda a operação. <br />
              <span className="text-slate-400">Em um só lugar.</span>
            </h2>
          </div>

          {/* MOCKUP ÚNICO COM PROPORÇÃO, ILUMINAÇÃO DE ESTÚDIO E PROFUNDIDADE */}
          <div className="relative max-w-5xl mx-auto w-full">
            {/* LINHA DE LUZ NEON NO TOPO (ESTILO CUNDO) */}
            <div className="h-[2px] w-2/3 mx-auto bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent blur-[1px]" />

            {/* MOLDURA DO DISPOSITIVO */}
            <div className="relative rounded-2xl md:rounded-3xl border border-white/15 bg-[#07090F]/90 backdrop-blur-xl shadow-[0_40px_120px_rgba(0,0,0,0.95)] overflow-hidden text-left mt-2">
              {/* HEADER DO SOFTWARE */}
              <div className="h-12 border-b border-white/[0.08] bg-[#04060B] px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  </div>
                  <span className="text-xs font-mono text-slate-400 pl-3 border-l border-white/10">
                    vendra.app · Visão Consolidada
                  </span>
                </div>
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  4 Filiais Sincronizadas
                </div>
              </div>

              {/* CONTEÚDO MINIMALISTA DE SOFTWARE */}
              <div className="p-8 sm:p-12 space-y-10">
                {/* LINHA DE 3 NÚMEROS ESTRATÉGICOS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-b border-white/[0.06] pb-10">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Receita Bruta Hoje</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white mt-2 font-mono">€ 48.250,80</div>
                    <div className="text-xs text-emerald-400 mt-1 font-mono font-bold">+24,6% vs média</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Operações no PDV</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white mt-2 font-mono">184 vendas</div>
                    <div className="text-xs text-cyan-400 mt-1 font-mono font-bold">Tempo médio: 1.2s</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Margem Operacional</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white mt-2 font-mono">42,4%</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">Auditoria contínua</div>
                  </div>
                </div>

                {/* GRÁFICO PURISTA & LIMPO */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span>Curva de Vendas por Hora</span>
                    <span className="font-mono text-emerald-400">Consolidado Matriz & Filiais</span>
                  </div>
                  <div className="h-28 w-full flex items-end gap-3 pt-2">
                    {[32, 45, 50, 42, 68, 62, 85, 78, 95, 110, 125, 118, 140, 130].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <div
                          style={{ height: `${(h / 140) * 100}%` }}
                          className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500/20 via-emerald-400/50 to-white group-hover:to-emerald-300 transition-all"
                        />
                        <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">{i + 8}h</span>
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
        SEÇÃO 3 — O COMÉRCIO EM MOVIMENTO: FOTOGRAFIAS EM TELA AMPLA E NARRATIVA VISUAL
        ========================================================================
      */}
      <section id="comercio" className="relative w-full py-28 md:py-40 border-t border-white/[0.08] bg-[#000000] flex flex-col items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-3xl mb-14 text-left space-y-4">
            <span className="text-xs font-mono tracking-[0.25em] uppercase text-cyan-400 font-bold">
              Especialização Comercial
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
              O comércio em movimento.
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Uma plataforma única que se adapta com perfeição aos fluxos do seu balcão.
            </p>
          </div>

          {/* SELETOR EM LINHA EDITORIAL DOS 8 SEGMENTOS */}
          <div className="flex items-center gap-6 overflow-x-auto pb-4 mb-10 no-scrollbar border-b border-white/[0.08] w-full">
            {COMMERCIAL_SECTORS.map((sector) => (
              <button
                key={sector.id}
                onClick={() => setActiveSectorId(sector.id)}
                className={`text-sm font-semibold whitespace-nowrap transition-all pb-3 relative ${
                  activeSectorId === sector.id
                    ? "text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sector.name}
                {activeSectorId === sector.id && (
                  <motion.div
                    layoutId="activeSectorLine"
                    className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400"
                  />
                )}
              </button>
            ))}
          </div>

          {/* GRANDE IMAGEM CINEMATOGRÁFICA EM TELA AMPLA COM NARRATIVA */}
          <div className="relative rounded-3xl overflow-hidden min-h-[520px] md:min-h-[640px] flex items-end p-8 sm:p-14 border border-white/10 group w-full">
            {/* FOTOGRAFIA FULL BLEED COM TRATAMENTO ESCURO DE CINEMA */}
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedSector.id}
                src={selectedSector.image}
                alt={selectedSector.title}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.45] contrast-[1.1]"
              />
            </AnimatePresence>

            {/* GRADIENTE DE PROFUNDIDADE */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

            {/* TÍTULO ELEGANTE E NARRATIVA SOBRE A FOTOGRAFIA */}
            <div className="relative z-10 max-w-2xl space-y-4 text-left">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md inline-block">
                {selectedSector.kpi}
              </span>
              <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                {selectedSector.title}
              </h3>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                {selectedSector.narrative}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 4 — INTELIGÊNCIA: UMA PERGUNTA, UMA RESPOSTA, UMA VISUALIZAÇÃO
        ========================================================================
      */}
      <section id="inteligencia" className="relative w-full py-28 md:py-40 border-t border-white/[0.08] bg-[#020306] flex flex-col items-center">
        <div className="max-w-4xl mx-auto px-6 text-left space-y-12 w-full">
          <div className="space-y-4">
            <span className="text-xs font-mono tracking-[0.25em] uppercase text-cyan-400 font-bold">
              Vendra AI
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
              Inteligência que compreende <br />
              <span className="text-slate-400">o seu negócio.</span>
            </h2>
          </div>

          {/* A EXPERIÊNCIA MINIMALISTA: UMA PERGUNTA, UMA RESPOSTA, UMA VISUALIZAÇÃO */}
          <div className="rounded-3xl border border-white/10 bg-[#07090F] p-8 sm:p-14 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                Pergunta do Gestor
              </span>
              <p className="text-xl sm:text-2xl font-bold text-white leading-snug">
                &ldquo;Qual o desempenho consolidado das filiais hoje?&rdquo;
              </p>
            </div>

            <div className="space-y-2 pt-6 border-t border-white/[0.08]">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                Resposta Analítica
              </span>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Foram consolidadas 184 operações com faturamento total de € 48.250,80 e margem média de 42,4%. Todas as
                4 filiais operam acima da meta diária projetada.
              </p>
            </div>

            {/* UMA VISUALIZAÇÃO DE DADOS LIMPA */}
            <div className="pt-6 border-t border-white/[0.08] space-y-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Distribuição de Receita por Canal
              </span>
              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden flex">
                <div style={{ width: "45%" }} className="h-full bg-cyan-400" title="Matriz Centro (45%)" />
                <div style={{ width: "28%" }} className="h-full bg-teal-400" title="Filial Norte (28%)" />
                <div style={{ width: "17%" }} className="h-full bg-indigo-400" title="Filial Sul (17%)" />
                <div style={{ width: "10%" }} className="h-full bg-slate-400" title="Store Online (10%)" />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400 pt-1">
                <span>Matriz · € 21.712</span>
                <span>Norte · € 13.510</span>
                <span>Sul · € 8.202</span>
                <span>Store · € 4.825</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 5 — ECOSSISTEMA: COMPOSIÇÃO ARTÍSTICA COM POUCOS TEXTOS E MUITO ESPAÇO
        ========================================================================
      */}
      <section id="ecossistema" className="relative w-full py-28 md:py-40 border-t border-white/[0.08] bg-[#000000] flex flex-col items-center">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16 w-full">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono tracking-[0.25em] uppercase text-cyan-400 font-bold">
              Ecossistema Integrado
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
              Cinco produtos. Uma única base.
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Conectados nativamente para eliminar sistemas paralelos e retrabalho.
            </p>
          </div>

          {/* COMPOSIÇÃO ESPAÇOSA E MINIMALISTA */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-left">
            {ECOSYSTEM_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-8 rounded-3xl border border-white/[0.08] bg-[#04060C] hover:border-white/20 transition-all space-y-6 flex flex-col justify-between"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 text-white flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">{item.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 6 — PLANOS: OS TRÊS PREÇOS APROVADOS DE FORMA ELEGANTE
        ========================================================================
      */}
      <section id="planos" className="relative w-full py-28 md:py-40 border-t border-white/[0.08] bg-[#020306] flex flex-col items-center">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-16 w-full">
          <div className="max-w-3xl mx-auto space-y-4">
            <span className="text-xs font-mono tracking-[0.25em] uppercase text-cyan-400 font-bold">
              Planos & Preços
            </span>
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
              Preços claros e transparentes.
            </h2>
            <p className="text-slate-400 text-base">
              Valores mensais sem IVA. Cancele ou altere a qualquer momento.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            {APPROVED_PRICING.map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-3xl p-9 border flex flex-col justify-between transition-all relative ${
                  plan.featured
                    ? "border-cyan-400/50 bg-[#070A12] shadow-[0_0_50px_rgba(6,182,212,0.15)]"
                    : "border-white/[0.08] bg-[#04060B]"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold uppercase tracking-widest">
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="text-5xl font-extrabold text-white font-mono">{plan.price}</span>
                      <span className="text-slate-400 text-sm font-normal">{plan.period}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{plan.desc}</p>
                  </div>

                  <div className="h-px bg-white/[0.08]" />

                  <div className="space-y-3">
                    {plan.perks.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <Link
                    to="/entrar"
                    className={`w-full py-3.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                      plan.featured
                        ? "bg-white hover:bg-slate-200 text-slate-950 shadow-md"
                        : "border border-white/20 hover:border-white/40 bg-white/[0.04] text-white"
                    }`}
                  >
                    Escolher {plan.name}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO 7 — ENCERRAMENTO & RODAPÉ EDITORIAL
        ========================================================================
      */}
      <section className="relative w-full py-28 md:py-40 border-t border-white/[0.08] bg-[#000000] text-center overflow-hidden flex flex-col items-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 space-y-8 relative z-10 w-full">
          <h2 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight leading-tight">
            Seu próximo nível <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-white bg-clip-text text-transparent">
              começa agora.
            </span>
          </h2>

          <div className="pt-4">
            <Link
              to="/entrar"
              className="px-9 py-4 rounded-full bg-white hover:bg-slate-200 text-slate-950 font-extrabold text-xs tracking-widest uppercase transition-all inline-flex items-center gap-2 shadow-[0_0_35px_rgba(255,255,255,0.25)]"
            >
              Conhecer VENDRA <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* RODAPÉ MINIMALISTA */}
      <footer className="w-full border-t border-white/[0.08] bg-[#000000] py-14 text-xs text-slate-400 flex justify-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 w-full">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-sm tracking-[0.2em] text-white">VENDRA</span>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase pl-2 border-l border-white/15">
              by BonaSoft
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            © {new Date().getFullYear()} VENDRA by BonaSoft. Todos os direitos reservados. Brasil & Espanha.
          </div>
        </div>
      </footer>
    </div>
  );
}
