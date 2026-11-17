import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronRight, Check } from "lucide-react";

export const Route = createFileRoute("/proposta")({
  head: () => ({
    meta: [
      { title: "HUG | Uma nova forma de administrar seu negócio" },
      {
        name: "description",
        content:
          "Vendas, gestão, estoque e inteligência empresarial conectados em uma única plataforma. by BonaSoft.",
      },
    ],
  }),
  component: PropostaSquarespacePage,
});

// Segmentos comerciais com fotografia editorial de alto padrão
const EDITORIAL_SECTORS = [
  {
    id: "farmacia",
    name: "Farmácias",
    title: "Farmácias & Drogarias",
    tagline: "Rastreabilidade completa de lotes, datas de validade e controle rigoroso de receituário.",
    kpi: "Rastreio Unitário · 100% Auditado",
    image:
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "supermercado",
    name: "Supermercados",
    title: "Mercados & Mercearias",
    tagline: "Checkout de alta velocidade, integração nativa com balanças e múltiplos caixas simultâneos.",
    kpi: "Operação Contínua · < 1.2s por Item",
    image:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "moda",
    name: "Moda & Vestuário",
    title: "Boutiques & Confecções",
    tagline: "Grade multidimensional de cores e tamanhos com catálogo de coleções em tempo real.",
    kpi: "Grade Matricial · Estoque Unificado",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "restaurante",
    name: "Gastronomia",
    title: "Restaurantes & Bares",
    tagline: "Comandas eletrônicas, mesas sincronizadas e baixa automática de estoque por ficha técnica.",
    kpi: "Salão & Cozinha · Sincronia Instantânea",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "beleza",
    name: "Beleza & Estética",
    title: "Salões & Clínicas de Estética",
    tagline: "Agenda integrada por profissional, cálculo automático de comissões e histórico de atendimentos.",
    kpi: "Comissão Automática · Gestão de Agenda",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "petshop",
    name: "Pet Shops",
    title: "Pet Shops & Veterinárias",
    tagline: "Fila de serviços de banho e tosa, perfil do animal, ração a granel e controle clínico.",
    kpi: "Histórico do Pet · Venda Fracionada",
    image:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "eletronicos",
    name: "Eletrônicos",
    title: "Eletrônicos & Assistência",
    tagline: "Rastreamento obrigatório por Número de Série / IMEI no caixa, ordens de serviço e termos de garantia.",
    kpi: "Segurança por IMEI · Ordens de Serviço",
    image:
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "construcao",
    name: "Materiais de Construção",
    title: "Home Centers & Depósitos",
    tagline: "Venda fracionada (m², kg, metro linear), carregamento por lote e integração de pronta entrega.",
    kpi: "Conversão de Unidades · Logística Ágil",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=85",
  },
];

// 5 Pilares do Ecossistema solicitados
const ECOSYSTEM_ITEMS = [
  {
    id: "erp",
    name: "HUG ERP",
    category: "Gestão Central",
    description:
      "Controle financeiro consolidado, estoque matricial, compras e faturamento integrado para matriz e filiais.",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "pos",
    name: "HUG POS",
    category: "Frente de Caixa",
    description:
      "Checkout ultra-rápido projetado para operar com leitor, teclado e balança. Resposta em menos de 1,2s por transação.",
    image:
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "mobile",
    name: "HUG Mobile",
    category: "Operação Portátil",
    description:
      "Atendimento em salão, consulta ágil de preços no balcão e auditoria de inventário diretamente no smartphone.",
    image:
      "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "store",
    name: "HUG Store",
    category: "Canal Digital",
    description:
      "Catálogo público e vendas digitais unificadas ao estoque físico, permitindo compras com retirada ou entrega rápida.",
    image:
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "ai",
    name: "HUG AI",
    category: "Inteligência Comercial",
    description:
      "Análise preditiva de compras, detecção de padrões de consumo e auditoria em linguagem natural sobre seus dados reais.",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
];

function PropostaSquarespacePage() {
  const [activeSector, setActiveSector] = useState(EDITORIAL_SECTORS[0]);

  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] text-[#111111] font-sans antialiased selection:bg-[#0D9488]/20 selection:text-[#0F766E] overflow-x-hidden">
      
      {/* 
        ========================================================================
        NAVBAR EDITORIAL MINIMALISTA (ESTILO SQUARESPACE)
        ========================================================================
      */}
      <header className="sticky top-0 inset-x-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-xl border-b border-black/[0.06] transition-all">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 h-20 flex items-center justify-between">
          {/* LOGOTIPO ELEGANTE */}
          <Link to="/proposta" className="flex items-center gap-3">
            <span className="font-extrabold text-xl tracking-[0.18em] text-black">
              HUG
            </span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-black/50 pl-2.5 border-l border-black/20">
              BONASOFT HUG
            </span>
          </Link>

          {/* NAVEGAÇÃO MINIMALISTA */}
          <nav className="hidden lg:flex items-center gap-10 text-xs font-medium tracking-wide text-black/70">
            <a href="#ecossistema" className="hover:text-black transition-colors">
              Ecossistema
            </a>
            <a href="#gestao" className="hover:text-black transition-colors">
              Gestão
            </a>
            <a href="#segmentos" className="hover:text-black transition-colors">
              Segmentos
            </a>
            <a href="#planos" className="hover:text-black transition-colors">
              Planos
            </a>
          </nav>

          {/* AÇÕES DE CABEÇALHO */}
          <div className="flex items-center gap-6">
            <Link
              to="/entrar"
              className="text-xs font-medium text-black/80 hover:text-black transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/entrar"
              className="px-6 py-2.5 rounded-full bg-black text-white hover:bg-black/85 text-xs font-semibold tracking-wide transition-all shadow-sm"
            >
              Solicitar demonstração
            </Link>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        1. HERO: GRANDE COMPOSIÇÃO VISUAL, TIPOGRAFIA EDITORIAL E RESPIRO
        ========================================================================
      */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-6 sm:px-12 max-w-[1440px] mx-auto">
        <div className="max-w-4xl space-y-6">
          {/* IDENTIFICADOR DA MARCA */}
          <div className="text-xs font-mono tracking-[0.25em] uppercase text-[#0D9488] font-bold">
            BONASOFT HUG
          </div>

          {/* HEADLINE EDITORIAL EXATA SOLICITADA */}
          <h1 className="text-5xl sm:text-7xl lg:text-[84px] font-medium tracking-[-0.035em] text-black leading-[1.02]">
            Uma nova forma de administrar seu negócio.
          </h1>

          {/* SUBHEADLINE EXATA SOLICITADA */}
          <p className="text-lg sm:text-2xl text-black/65 font-normal max-w-2xl leading-relaxed pt-2">
            Vendas, gestão, estoque e inteligência empresarial conectados em uma única plataforma.
          </p>

          {/* BOTÕES COM PROPORÇÃO REFINADA */}
          <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              to="/entrar"
              className="px-8 py-4 rounded-full bg-black hover:bg-black/85 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-md text-center"
            >
              Conhecer a plataforma
            </Link>
            <Link
              to="/entrar"
              className="px-8 py-4 rounded-full border border-black/20 hover:border-black/50 text-black text-xs font-semibold tracking-wide transition-all text-center flex items-center justify-center gap-2"
            >
              <span>Solicitar demonstração</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* GRANDE COMPOSIÇÃO VISUAL EM DESTAQUE (ESTILO SQUARESPACE) */}
        <div className="mt-16 md:mt-24 relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.08)] bg-black">
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
            <img
              src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=2400&q=90"
              alt="Ambiente comercial contemporâneo de atendimento"
              className="w-full h-full object-cover opacity-85"
            />
            {/* GRADIENTE SUAVE DE PROFUNDIDADE */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            {/* LEGENDA EDITORIAL EMBUTIDA */}
            <div className="absolute bottom-8 left-8 sm:bottom-12 sm:left-12 max-w-md text-white">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#14B8A6] block mb-2 font-bold">
                A Experiência no Ponto de Venda
              </span>
              <p className="text-xl sm:text-2xl font-light leading-snug">
                Projetado para operações onde estética, velocidade e governança caminham juntas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        2. SEÇÃO ECOSSISTEMA: CINCO PILARES COM COMPOSIÇÕES PRÓPRIAS
        ========================================================================
      */}
      <section id="ecossistema" className="py-24 md:py-36 px-6 sm:px-12 max-w-[1440px] mx-auto border-t border-black/[0.06]">
        {/* CABEÇALHO DA SEÇÃO */}
        <div className="max-w-2xl mb-16 md:mb-24 space-y-4">
          <span className="text-xs font-mono tracking-[0.25em] uppercase text-[#0D9488] font-bold">
            O Ecossistema
          </span>
          <h2 className="text-4xl sm:text-6xl font-medium tracking-tight text-black leading-tight">
            Cinco pilares. Uma operação contínua.
          </h2>
          <p className="text-base sm:text-lg text-black/65 font-normal">
            Cada módulo do HUG foi concebido para resolver uma frente crítica do seu negócio com elegância, velocidade e consistência.
          </p>
        </div>

        {/* GRADE EDITORIAL DE COMPOSIÇÕES COM AMPLO ESPAÇO NEGATIVO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {ECOSYSTEM_ITEMS.map((item, index) => (
            <div
              key={item.id}
              className={`group rounded-2xl bg-white border border-black/[0.06] overflow-hidden flex flex-col transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.06)] ${
                index === 0 ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100 relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-mono tracking-wider uppercase text-black font-bold">
                  {item.category}
                </div>
              </div>
              <div className="p-8 sm:p-10 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-medium text-black tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-sm sm:text-base text-black/65 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-2 text-xs font-semibold text-[#0D9488]">
                  <span>Conhecer arquitetura</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 
        ========================================================================
        3. SEÇÃO GESTÃO: CONTRASTE ESCURO EDITORIAL & MOCKUP LIMPO DE COMPUTADOR
        ========================================================================
      */}
      <section id="gestao" className="py-28 md:py-40 bg-[#0C0D12] text-white">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12">
          {/* CABEÇALHO COM CONTRASTE */}
          <div className="max-w-3xl mb-16 md:mb-20 space-y-4">
            <span className="text-xs font-mono tracking-[0.25em] uppercase text-[#14B8A6] font-bold">
              HUG ERP
            </span>
            <h2 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-tight">
              Controle absoluto. Sem ruído.
            </h2>
            <p className="text-base sm:text-lg text-white/60 font-normal">
              Informações consolidadas de vendas, faturamento e estoque em uma interface serena e sem distrações visuais.
            </p>
          </div>

          {/* MOCKUP ELEGANTE DE COMPUTADOR (SEM EXCESSO DE INDICADORES) */}
          <div className="relative rounded-2xl md:rounded-3xl border border-white/10 bg-[#14161F] p-4 sm:p-6 shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
            {/* BARRA SUPERIOR DO NAVEGADOR */}
            <div className="h-10 border-b border-white/[0.08] px-4 flex items-center justify-between text-xs text-white/40 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
              </div>
              <span>hug.bonasoft.app/visao-geral</span>
              <div className="w-12" />
            </div>

            {/* INTERFACE LIMPA & MINIMALISTA */}
            <div className="p-6 sm:p-12 space-y-12">
              {/* LINHA DE TRÊS NÚMEROS RELEVANTES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-b border-white/[0.06] pb-10">
                <div>
                  <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Faturamento do Dia</span>
                  <div className="text-3xl sm:text-4xl font-mono font-medium text-white mt-2">R$ 42.180,00</div>
                  <span className="text-xs text-[#14B8A6] mt-1 block font-mono font-semibold">+18% vs semana anterior</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Velocidade de Checkout</span>
                  <div className="text-3xl sm:text-4xl font-mono font-medium text-white mt-2">1,1 seg</div>
                  <span className="text-xs text-white/50 mt-1 block font-mono">Tempo médio por item</span>
                </div>
                <div>
                  <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Índice de Ruptura</span>
                  <div className="text-3xl sm:text-4xl font-mono font-medium text-white mt-2">0,2%</div>
                  <span className="text-xs text-white/50 mt-1 block font-mono">Estoque monitorado</span>
                </div>
              </div>

              {/* CURVA DE DESEMPENHO EDITORIAL DISCRETA */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-white/60 font-medium">
                  <span>Fluxo Horário Consolidado</span>
                  <span className="font-mono text-[#14B8A6]">Tempo Real</span>
                </div>
                <div className="h-28 w-full flex items-end gap-3 pt-4">
                  {[28, 42, 55, 48, 70, 85, 92, 110, 135, 120, 140, 130].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        style={{ height: `${(val / 140) * 100}%` }}
                        className="w-full rounded-t-sm bg-gradient-to-t from-white/10 to-[#14B8A6]/80 hover:to-[#14B8A6] transition-all"
                      />
                      <span className="text-[10px] font-mono text-white/30 hidden sm:inline">{idx + 8}h</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        4. SEÇÃO SEGMENTOS: FOTOGRAFIA EDITORIAL DE ALTO PADRÃO
        ========================================================================
      */}
      <section id="segmentos" className="py-24 md:py-36 px-6 sm:px-12 max-w-[1440px] mx-auto">
        <div className="max-w-2xl mb-12 space-y-4">
          <span className="text-xs font-mono tracking-[0.25em] uppercase text-[#0D9488] font-bold">
            Especialização Comercial
          </span>
          <h2 className="text-4xl sm:text-6xl font-medium tracking-tight text-black leading-tight">
            Desenhado para o seu comércio.
          </h2>
          <p className="text-base sm:text-lg text-black/65 font-normal">
            Da alta rotação do supermercado à rastreabilidade de especialidades farmacêuticas, a plataforma respeita cada modelo de negócio.
          </p>
        </div>

        {/* NAVEGAÇÃO EDITORIAL DOS 8 SEGMENTOS */}
        <div className="flex items-center gap-8 border-b border-black/10 pb-4 mb-10 overflow-x-auto no-scrollbar">
          {EDITORIAL_SECTORS.map((sector) => (
            <button
              key={sector.id}
              onClick={() => setActiveSector(sector)}
              className={`text-sm font-medium tracking-wide whitespace-nowrap transition-colors relative pb-4 ${
                activeSector.id === sector.id
                  ? "text-black font-semibold"
                  : "text-black/50 hover:text-black"
              }`}
            >
              {sector.name}
              {activeSector.id === sector.id && (
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#0D9488]" />
              )}
            </button>
          ))}
        </div>

        {/* COMPOSIÇÃO FOTOGRÁFICA AMPLA COM NARRATIVA DIRETA */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl border border-black/[0.06] overflow-hidden p-8 sm:p-12 shadow-sm">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-block px-3 py-1 rounded-full bg-[#0D9488]/10 text-[11px] font-mono tracking-widest uppercase text-[#0D9488] font-bold">
              {activeSector.kpi}
            </div>
            <h3 className="text-3xl sm:text-5xl font-medium text-black tracking-tight leading-tight">
              {activeSector.title}
            </h3>
            <p className="text-base text-black/70 leading-relaxed font-normal">
              {activeSector.tagline}
            </p>
            <div className="pt-2">
              <Link
                to="/entrar"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black border-b border-black pb-1 hover:text-[#0D9488] hover:border-[#0D9488] transition-colors"
              >
                <span>Conhecer fluxos específicos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 shadow-md">
            <img
              src={activeSector.image}
              alt={activeSector.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        RODAPÉ EDITORIAL MINIMALISTA
        ========================================================================
      */}
      <footer className="border-t border-black/[0.08] bg-[#FAF9F6] py-16 px-6 sm:px-12 max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-black/60 font-normal">
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-widest text-black">HUG</span>
          <span className="font-mono text-[10px]">by BonaSoft</span>
        </div>
        <div>
          © {new Date().getFullYear()} BonaSoft. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
