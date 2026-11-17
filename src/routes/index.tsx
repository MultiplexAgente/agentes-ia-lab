import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Check,
  ShoppingBag,
  Layers,
  MessageSquare,
  Store,
  Smartphone,
  Laptop,
  Globe,
} from "lucide-react";
import horizon from "@/assets/hero-horizon.jpg";
import monolith from "@/assets/monolith.jpg";
import { BonaParticleAtom } from "@/components/bonasoft/BonaLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HUG — Seu negócio, em outra órbita" },
      {
        name: "description",
        content:
          "HUG — Vendas, gestão, ponto de venda, catálogo e inteligência comercial integrados em uma única plataforma.",
      },
      { property: "og:title", content: "HUG — Seu negócio, em outra órbita" },
      {
        property: "og:description",
        content:
          "Vendas, estoque, gestão empresarial e inteligência comercial integrados pelo HUG.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ease = [0.22, 1, 0.36, 1] as const;

// 1. Narrativa Contínua dos Três Pilares (Sem formato de cards, composições amplas)
const NARRATIVE_PILLARS = [
  {
    step: "01",
    title: "Venda em qualquer frente.",
    subtitle: "Do balcão físico ao catálogo online e canais de mensagem.",
    description:
      "Uma frente de caixa instantânea com leitor de código de barras, pagamentos ágeis e sincronia em tempo real com pedidos digitais.",
    highlights: [
      "PDV ágil com resposta em menos de um segundo",
      "Catálogo digital sincronizado com o estoque físico",
      "Emissão rápida de comprovantes e documentos fiscais",
    ],
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85",
  },
  {
    step: "02",
    title: "Controle absoluto em tempo real.",
    subtitle: "Estoque, clientes e faturamento sem planilhas soltas.",
    description:
      "Cada venda realizada atualiza imediatamente a disponibilidade dos produtos. Acompanhe entradas, saídas, margens e histórico de compra de cada cliente.",
    highlights: [
      "Baixa automática de estoque multi-canal",
      "Histórico detalhado e preferências dos clientes",
      "Fluxo de caixa diário consolidado sem retrabalho",
    ],
    image:
      "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1600&q=85",
  },
  {
    step: "03",
    title: "Inteligência que entende o seu negócio.",
    subtitle: "Uma assistente conectada à realidade dos seus dados.",
    description:
      "Tire dúvidas rápidas sobre o catálogo, consulte disponibilidade em estoque e receba sugestões objetivas de atendimento para o seu time de vendas.",
    highlights: [
      "Consulta instantânea de produtos por conversa",
      "Sugestões de resposta a dúvidas com AI Gateway",
      "Agilidade operacional sem interfaces complicadas",
    ],
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=85",
  },
];

// 2. Ecossistema Comercial HUG (Apresentação Editorial)
const ECOSYSTEM_MODULES = [
  {
    id: "gestao",
    name: "HUG Gestão",
    label: "Gestão Empresarial",
    icon: Laptop,
    description:
      "Visão centralizada de faturamento, controle financeiro, compras e relatórios consolidados para matriz e filiais.",
  },
  {
    id: "pos",
    name: "HUG POS",
    label: "Ponto de Venda",
    icon: Store,
    description:
      "Frente de caixa rápida com suporte a leitor de código de barras, teclado de atalho e múltiplos caixas simultâneos.",
  },
  {
    id: "app",
    name: "HUG Mobile",
    label: "Aplicativo",
    icon: Smartphone,
    description:
      "Mobilidade total para atendimento em salão, consulta de preços no balcão e auditoria de inventário pelo celular.",
  },
  {
    id: "store",
    name: "HUG Store",
    label: "Loja Virtual",
    icon: Globe,
    description:
      "Catálogo público digital integrado ao estoque físico para pedidos com retirada no balcão ou entrega rápida.",
  },
  {
    id: "intelligence",
    name: "HUG Intelligence",
    label: "Inteligência Artificial",
    icon: MessageSquare,
    description:
      "Assistente para tirar dúvidas de clientes, consultar o catálogo em linguagem natural e apoiar o dia a dia do lojista.",
  },
];

// 3. Segmentos Comerciais com Fotografia Editorial
const COMMERCIAL_SECTORS = [
  {
    id: "farmacia",
    name: "Farmácias",
    title: "Farmácias & Drogarias",
    narrative:
      "Rastreabilidade completa de lotes, controle de validades e retenção rigorosa de receituário.",
    kpi: "Rastreio Unitário · 100% Auditado",
    image:
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "mercado",
    name: "Mercados",
    title: "Supermercados & Mercearias",
    narrative:
      "Checkout de alta rotação, integração com balanças e sincronia com múltiplos caixas simultâneos.",
    kpi: "Operação Rápida · < 1.2s por Item",
    image:
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "moda",
    name: "Moda",
    title: "Moda & Vestuário",
    narrative:
      "Grade multidimensional de cores e tamanhos com catálogo de coleções sincronizado em tempo real.",
    kpi: "Grade Matricial · Estoque Unificado",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "restaurante",
    name: "Gastronomia",
    title: "Restaurantes & Bares",
    narrative:
      "Comandas eletrônicas, mesas sincronizadas e baixa automática de estoque por ficha técnica dos pratos.",
    kpi: "Salão & Cozinha · Sincronia Instantânea",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "beleza",
    name: "Beleza",
    title: "Salões & Estética",
    narrative:
      "Agenda integrada por profissional, cálculo automático de comissões e histórico de atendimentos.",
    kpi: "Comissão Automática · Gestão de Agenda",
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "construcao",
    name: "Construção",
    title: "Materiais de Construção",
    narrative:
      "Venda fracionada (m², kg, metro linear), carregamento por lote e logística ágil de pronta entrega.",
    kpi: "Conversão de Unidades · Logística Ágil",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=85",
  },
];

// 4. Planos Oficiais Aprovados
const APPROVED_PLANS = [
  {
    name: "Starter",
    price: "299,00",
    tagline: "Para comércios e lojas que buscam agilidade no balcão e presença online.",
    features: [
      "Frente de caixa (PDV) ágil",
      "Catálogo online integrado",
      "Controle de estoque e vendas",
      "Gestão de clientes e histórico",
    ],
  },
  {
    name: "Business",
    price: "499,00",
    featured: true,
    tagline: "Para negócios em crescimento que necessitam de multicanalidade e inteligência.",
    features: [
      "Todos os recursos do Starter",
      "Operação multicanal (balcão + web)",
      "Assistente HUG para consulta e respostas",
      "Controle de múltiplos caixas",
      "Relatórios detalhados de faturamento",
    ],
  },
  {
    name: "Premium",
    price: "899,00",
    tagline: "Para empresas com alto volume operacional, múltiplas filiais e equipes ampliadas.",
    features: [
      "Todos os recursos do Business",
      "Multi-filiais e estoques conectados",
      "Acesso prioritário à inteligência HUG",
      "Auditoria avançada e conciliação",
      "Suporte técnico prioritário",
    ],
  },
];

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 35, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 1.1, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.02, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-35%"]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const [selectedSector, setSelectedSector] = useState(COMMERCIAL_SECTORS[0]);

  return (
    <div className="dark min-h-screen bg-[#03060a] font-sans text-foreground antialiased selection:bg-emerald-500/25 selection:text-emerald-200">
      {/* 
        ========================================================================
        NAVBAR: Minimalista, Fina e Elegante
        ========================================================================
      */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#03060a]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 sm:h-20 sm:px-10">
          <Link
            to="/"
            className="text-[14px] font-medium tracking-[0.45em] sm:text-[16px] sm:tracking-[0.55em] text-foreground transition-colors hover:text-white"
          >
            HUG
          </Link>

          <nav className="hidden items-center gap-9 text-xs tracking-wider uppercase text-muted-foreground/80 md:flex">
            <a href="#pilares" className="transition-colors hover:text-foreground">
              Pilares
            </a>
            <a href="#ecossistema" className="transition-colors hover:text-foreground">
              Ecossistema
            </a>
            <a href="#inteligencia" className="transition-colors hover:text-foreground">
              Inteligência
            </a>
            <a href="#segmentos" className="transition-colors hover:text-foreground">
              Segmentos
            </a>
            <a href="#planos" className="transition-colors hover:text-foreground">
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/entrar"
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2 text-xs font-medium text-foreground backdrop-blur-md transition hover:border-emerald-400/60 hover:bg-white/10"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* 
        ========================================================================
        HERO: Planeta Iluminado, Universo Espacial e Cinematográfico
        ========================================================================
      */}
      <section ref={heroRef} className="relative min-h-[82vh] lg:min-h-[88vh] overflow-hidden flex flex-col justify-center">
        {/* Imagem do Horizonte Planetário */}
        <motion.img
          src={horizon}
          alt="Horizonte de um planeta iluminado no espaço"
          width={1920}
          height={1088}
          style={{ y: imgY, scale: imgScale }}
          className="absolute inset-0 h-full w-full object-cover object-[50%_62%] brightness-[0.95] contrast-[1.1]"
        />

        {/* Gradientes atmosféricos de profundidade e fusão */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#03060a] via-[#03060a]/20 to-[#03060a]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,230,118,0.08),_transparent_65%)] pointer-events-none" />

        {/* Conteúdo Central do Hero */}
        <motion.div
          style={{ y: textY, opacity: fade }}
          className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-12 sm:pt-28 sm:pb-16 text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 35, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.6, ease, delay: 0.4 }}
            className="max-w-5xl text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-medium leading-[1.08] sm:leading-[1.03] tracking-[-0.035em] text-white"
          >
            Seu negócio,
            <br />
            <span className="text-muted-foreground/80">em outra órbita.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease, delay: 0.8 }}
            className="mt-4 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-slate-300/90 font-light"
          >
            Vendas, estoque, gestão empresarial e inteligência comercial integrados em uma única
            plataforma.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease, delay: 1 }}
            className="mt-7 flex w-full flex-col items-center gap-3.5 sm:w-auto sm:flex-row sm:gap-4"
          >
            <Link
              to="/entrar"
              onClick={() =>
                window.__lovableEvents?.track?.("project.cta_clicked", { cta: "comecar_agora" })
              }
              className="group inline-flex w-full max-w-xs justify-center items-center gap-3 sm:w-auto rounded-full border border-white/20 bg-white/[0.08] px-8 py-4 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-emerald-400/60 hover:bg-white/[0.16] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] active:bg-zinc-700 active:border-zinc-500 active:scale-[0.98]"
            >
              <span>Começar agora</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href="#pilares"
              className="group inline-flex w-full max-w-xs justify-center items-center gap-3 sm:w-auto rounded-full border border-white/20 bg-white/[0.08] px-8 py-4 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-emerald-400/60 hover:bg-white/[0.16] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] active:bg-zinc-700 active:border-zinc-500 active:scale-[0.98]"
            >
              <span>Conhecer a plataforma</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO PILARES: Narrativa Visual Contínua (SEM CARDS)
        ========================================================================
      */}
      <section id="pilares" className="relative mx-auto max-w-[1400px] px-6 pt-8 pb-14 sm:pt-10 sm:pb-20 md:px-12">
        <Reveal className="max-w-4xl mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-medium leading-[1.12] sm:leading-[1.08] tracking-[-0.03em] text-white">
            Tudo que sua empresa precisa para vender.
            <br />
            <span className="text-muted-foreground">Nada que ela não precise.</span>
          </h2>
        </Reveal>

        {/* Narrativa em Atos Visuais com Grandes Imagens e Amplo Espaço Negativo */}
        <div className="space-y-12 sm:space-y-16">
          {NARRATIVE_PILLARS.map((item, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <div
                key={item.step}
                className={`flex flex-col gap-8 lg:gap-14 items-center ${
                  isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
                }`}
              >
                {/* Composição Visual Panorâmica */}
                <Reveal className="w-full lg:w-3/5">
                  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl group min-h-[320px] sm:min-h-[440px]">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.6] contrast-[1.05] transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#03060a] via-transparent to-transparent pointer-events-none" />
                  </div>
                </Reveal>

                {/* Conteúdo Editorial com Alto Espaço Negativo */}
                <Reveal delay={0.2} className="w-full lg:w-2/5 space-y-4">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-white leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
                    {item.subtitle}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                    {item.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300/90">
                        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </Reveal>
              </div>
            );
          })}
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO ECOSSISTEMA: Apresentação Editorial dos 5 Módulos HUG
        ========================================================================
      */}
      <section
        id="ecossistema"
        className="relative border-t border-white/[0.08] bg-[#020408] py-14 sm:py-18"
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <Reveal className="max-w-3xl mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white">
              Cinco frentes sincronizadas.
              <br />
              <span className="text-muted-foreground">Uma única operação comercial.</span>
            </h2>
            <p className="mt-2.5 text-base sm:text-lg text-slate-400 leading-relaxed font-light">
              Toda a jornada da sua empresa — da retaguarda ao cliente final — conectada sob uma
              mesma base de dados e regras de negócio.
            </p>
          </Reveal>

          {/* Lista Editorial Elegante dos 5 Módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8 border-t border-white/10 pt-8 sm:pt-10">
            {ECOSYSTEM_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <Reveal key={mod.id} delay={i * 0.1} className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono tracking-wider text-emerald-400/90 uppercase">
                      {mod.label}
                    </span>
                    <h4 className="text-xl font-medium text-white mt-1">{mod.name}</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {mod.description}
                  </p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO INTELIGÊNCIA ARTIFICIAL: Monólito de Vidro Escuro e Demonstração Real
        ========================================================================
      */}
      <section id="inteligencia" className="relative min-h-[65vh] overflow-hidden flex items-center">
        {/* Monólito de Vidro Escuro como Plano de Fundo Cinematográfico */}
        <img
          src={monolith}
          alt="Monólito de vidro escuro iluminado"
          loading="lazy"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover brightness-[0.7] contrast-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#03060a] via-transparent to-[#03060a]" />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 mx-auto max-w-[1400px] w-full px-6 py-14 sm:py-18 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Texto de Apresentação */}
            <Reveal className="space-y-4 max-w-xl">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-medium leading-[1.08] tracking-[-0.03em] text-white">
                Você pede.
                <br />
                A HUG executa.
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-slate-300/90 font-light">
                Esqueça relatórios complicados e comandos difíceis. Uma assistente conversacional
                conectada diretamente aos dados reais da sua loja para tirar dúvidas e sugerir
                respostas imediatas.
              </p>
              <div className="pt-1">
                <Link
                  to="/respostas-ia"
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                >
                  <span>Experimentar assistente no app</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            {/* Demonstração Visual Realista e Elegante (Sem dashboard poluído) */}
            <Reveal delay={0.2}>
              <div className="rounded-3xl border border-white/15 bg-black/75 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono text-slate-300 uppercase tracking-wider">
                      Consulta Operacional em Tempo Real
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400/80">Sincronizado</span>
                </div>

                {/* Pergunta do Lojista */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left space-y-1">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">
                    Lojista · Balcão de Vendas
                  </span>
                  <p className="text-sm text-white">
                    "Temos o blazer linho tamanho M em estoque central para entrega ainda hoje?"
                  </p>
                </div>

                {/* Resposta Sugerida da HUG Intelligence */}
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                      HUG Intelligence
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/70">0.4s</span>
                  </div>
                  <p className="text-sm text-slate-100 leading-relaxed">
                    "Localizado no estoque central: <strong>4 unidades disponíveis</strong>. Preço
                    tabelado <strong>R$ 89,00</strong>. Deseja separar o pedido para retirada no balcão
                    ou gerar link de pagamento?"
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO SEGMENTOS: Fotografia Editorial Ampla
        ========================================================================
      */}
      <section id="segmentos" className="relative mx-auto max-w-[1400px] px-6 py-14 sm:py-18 md:px-12">
        <Reveal className="max-w-3xl mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white">
            Soluções especializadas para cada setor.
          </h2>
          <p className="mt-2 text-base sm:text-lg text-slate-400 font-light">
            Regras de negócio, termos comerciais e rotinas adaptadas à realidade de cada segmento.
          </p>
        </Reveal>

        {/* Seletor Minimalista de Segmentos */}
        <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-7">
          {COMMERCIAL_SECTORS.map((sec) => {
            const isSelected = selectedSector.id === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setSelectedSector(sec)}
                className={`rounded-full px-5 py-2 text-xs sm:text-sm font-medium transition-all ${
                  isSelected
                    ? "bg-white text-black shadow-lg"
                    : "border border-white/10 bg-white/5 text-muted-foreground hover:border-white/30 hover:text-white"
                }`}
              >
                {sec.name}
              </button>
            );
          })}
        </div>

        {/* Quadro Panorâmico Cinematográfico do Segmento Ativo */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[420px] sm:min-h-[500px] flex items-end p-6 sm:p-12">
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedSector.id}
              src={selectedSector.image}
              alt={selectedSector.title}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 h-full w-full object-cover brightness-[0.45] contrast-[1.1]"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3 text-left">
            <span className="inline-block rounded-full border border-white/20 bg-black/60 px-3.5 py-1 text-xs font-mono uppercase tracking-wider text-emerald-400 backdrop-blur-md">
              {selectedSector.kpi}
            </span>
            <h3 className="text-3xl sm:text-5xl font-medium text-white tracking-tight">
              {selectedSector.title}
            </h3>
            <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
              {selectedSector.narrative}
            </p>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        SEÇÃO PLANOS: Apresentação Transparente e Sem Poluição (R$ 299,00, R$ 499,00, R$ 899,00)
        ========================================================================
      */}
      <section
        id="planos"
        className="relative border-t border-white/[0.08] bg-[#020408] py-14 sm:py-18"
      >
        <div className="mx-auto max-w-[1400px] px-6 md:px-12">
          <Reveal className="max-w-3xl mx-auto text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white">
              Planos objetivos. Sem letras miúdas.
            </h2>
            <p className="mt-2.5 text-base sm:text-lg text-slate-400 font-light">
              Valores mensais sem taxa oculta de implantação. Cancele ou altere a qualquer momento.
            </p>
          </Reveal>

          {/* Grade Editorial dos 3 Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {APPROVED_PLANS.map((plan, idx) => (
              <Reveal
                key={plan.name}
                delay={idx * 0.15}
                className={`flex flex-col justify-between rounded-3xl p-7 sm:p-8 transition-all ${
                  plan.featured
                    ? "border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-950/30 via-black/80 to-black shadow-[0_0_40px_rgba(0,230,118,0.12)]"
                    : "border border-white/10 bg-black/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-medium text-white">{plan.name}</span>
                    {plan.featured && (
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="text-2xl font-light text-slate-400">R$</span>
                    <span className="text-5xl font-medium text-white tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-xs font-mono text-slate-400 uppercase">/ mês</span>
                  </div>
                  <p className="mt-3.5 text-sm text-slate-300/90 leading-relaxed font-light">
                    {plan.tagline}
                  </p>

                  <div className="mt-6 pt-5 border-t border-white/10 space-y-2.5">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300">
                        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    to="/entrar"
                    className={`block w-full text-center rounded-full py-3.5 text-xs font-medium uppercase tracking-wider transition ${
                      plan.featured
                        ? "bg-white text-black hover:bg-emerald-400"
                        : "border border-white/20 text-white hover:bg-white/10"
                    }`}
                  >
                    Começar com {plan.name}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        ENCERRAMENTO: Conclusão Cinematográfica Espacial
        ========================================================================
      */}
      <section
        id="comecar"
        className="relative overflow-hidden px-6 py-16 text-center sm:py-20 border-t border-white/[0.08]"
      >
        {/* Glow de fundo espacial */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[350px] w-[350px] sm:h-[500px] sm:w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[130px]" />

        <Reveal>
          <h2 className="relative mx-auto max-w-4xl text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.08] tracking-[-0.035em] text-white">
            O futuro do seu negócio
            <br />
            <span className="text-muted-foreground">começa em outra órbita.</span>
          </h2>
          <div className="mt-7 sm:mt-8 flex justify-center">
            <Link
              to="/entrar"
              onClick={() =>
                window.__lovableEvents?.track?.("project.cta_clicked", { cta: "criar_conta" })
              }
              className="group relative inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/[0.08] px-9 py-4 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:border-emerald-400/60 hover:bg-white/[0.16] hover:shadow-[0_0_25px_rgba(255,255,255,0.1)] active:bg-zinc-700 active:border-zinc-500 active:scale-[0.98]"
            >
              Criar minha conta HUG
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* 
        ========================================================================
        RODAPÉ: Centralizado com o Átomo Quântico em Movimento Oficial da BonaSoft
        ========================================================================
      */}
      <footer className="border-t border-white/[0.08] bg-[#020408] py-10 px-6">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-5 text-center">
          <div className="flex items-center justify-center gap-3">
            <BonaParticleAtom className="h-8 w-8 text-emerald-400" />
            <span className="font-sans font-light tracking-[0.28em] text-sm sm:text-base leading-none text-foreground uppercase">
              BONASOFT
            </span>
          </div>
          <p className="text-xs text-muted-foreground/60 font-mono tracking-wider">
            © {new Date().getFullYear()} BonaSoft. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
