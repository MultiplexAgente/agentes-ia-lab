import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import horizon from "@/assets/hero-horizon.jpg";
import monolith from "@/assets/monolith.jpg";
import { BonaCard3D } from "@/components/bonasoft/BonaCard3D";
import { BonaParticleAtom } from "@/components/bonasoft/BonaLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HUG — Seu negócio, em outra órbita" },
      { name: "description", content: "Vendas, estoque e atendimento inteligente em uma única plataforma. Simples de usar, pronta para crescer." },
      { property: "og:title", content: "HUG — Seu negócio, em outra órbita" },
      { property: "og:description", content: "Vendas, estoque e atendimento inteligente em uma única plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ease = [0.22, 1, 0.36, 1] as const;

const PILLARS = [
  { n: "01", t: "Venda", d: "Balcão, online e canais de mensagem num só lugar." },
  { n: "02", t: "Controle", d: "Estoque, clientes e pedidos atualizados em tempo real." },
  { n: "03", t: "I.A", d: "Uma assistente que entende seu negócio e trabalha por você." },
];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 1.2, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.2]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="dark min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/30">
      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:h-20 sm:px-6 md:px-10">
          <Link to="/" className="text-[13px] font-medium tracking-[0.35em] sm:text-[15px] sm:tracking-[0.5em] text-foreground">HUG</Link>
          <nav className="hidden gap-10 text-[13px] tracking-wide text-muted-foreground md:flex">
            <a href="#plataforma" className="transition-colors hover:text-foreground">Plataforma</a>
            <a href="#inteligencia" className="transition-colors hover:text-foreground">I.A</a>
            <a href="#comecar" className="transition-colors hover:text-foreground">Começar</a>
          </nav>
          <Link to="/entrar" className="rounded-full border border-foreground/20 px-5 py-2 text-[13px] text-foreground backdrop-blur-md transition hover:border-foreground/60">
            Entrar
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section ref={heroRef} className="relative h-[100svh] overflow-hidden">
        <motion.img
          src={horizon} alt="Horizonte de um planeta iluminado no espaço" width={1920} height={1088}
          style={{ y: imgY, scale: imgScale }}
          className="absolute inset-0 h-full w-full object-cover object-[50%_60%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <motion.div style={{ y: textY, opacity: fade }} className="relative z-10 flex h-full flex-col items-center justify-start px-5 pt-[24svh] text-center sm:px-6 sm:pt-[22vh]">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.3 }}
            className="mb-4 text-[10px] uppercase tracking-[0.4em] sm:mb-6 sm:text-[11px] sm:tracking-[0.6em] text-primary">
            Plataforma comercial inteligente
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 30, filter: "blur(12px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 1.6, ease, delay: 0.5 }}
            className="max-w-5xl text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-medium leading-[1.08] sm:leading-[1.04] tracking-[-0.03em]">
            Seu negócio,<br /><span className="text-muted-foreground">em outra órbita.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease, delay: 0.9 }}
            className="mt-5 max-w-xl text-sm sm:text-base md:text-lg leading-relaxed text-muted-foreground sm:mt-7">
            Vendas, estoque e atendimento com I.A em uma única plataforma.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease, delay: 1.1 }}
            className="mt-8 flex w-full flex-col items-center gap-2 sm:mt-10 sm:w-auto sm:flex-row sm:gap-4">
            <Link to="/entrar" onClick={() => window.__lovableEvents?.track?.("project.cta_clicked", { cta: "comecar_agora" })} className="group inline-flex w-full max-w-xs justify-center items-center gap-3 sm:w-auto rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition hover:bg-primary">
              Começar agora <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a href="#plataforma" className="px-6 py-4 text-sm text-muted-foreground transition hover:text-foreground">Conhecer a plataforma</a>
          </motion.div>
        </motion.div>
        <div className="absolute bottom-10 left-1/2 z-10 h-12 w-px -translate-x-1/2 overflow-hidden bg-foreground/10">
          <motion.div animate={{ y: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="h-1/2 w-full bg-primary" />
        </div>
      </section>

      {/* STATEMENT */}
      <section id="plataforma" className="mx-auto max-w-[1400px] px-6 py-24 sm:py-36 md:px-10 md:py-48">
        <Reveal>
          <p className="max-w-4xl text-2xl sm:text-4xl md:text-5xl font-normal leading-[1.24] sm:leading-[1.18] tracking-[-0.025em]">
            Tudo que sua empresa precisa para vender.
            <span className="text-muted-foreground"> Nada que ela não precise.</span>
          </p>
        </Reveal>

        <div className="mt-14 sm:mt-24 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.15}>
              <BonaCard3D
                tiltIntensity={7.5}
                className="group h-full bg-background p-8 sm:p-10 transition-colors duration-700 hover:bg-card md:p-12 cursor-pointer"
              >
                <span className="font-mono text-xs text-primary">{p.n}</span>
                <h3 className="mt-8 sm:mt-12 text-xl sm:text-2xl md:text-3xl font-medium leading-snug tracking-[-0.02em]">{p.t}</h3>
                <p className="mt-3.5 max-w-xs text-[15px] leading-relaxed text-muted-foreground">{p.d}</p>
              </BonaCard3D>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CINEMATIC BAND */}
      <section id="inteligencia" className="relative h-[85svh] sm:h-[110vh] overflow-hidden">
        <img src={monolith} alt="Monólito de vidro escuro iluminado" loading="lazy" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] items-end px-6 pb-20 sm:pb-32 md:px-10">
          <Reveal>
            <p className="mb-4 text-[11px] uppercase tracking-[0.6em] text-primary sm:mb-6">I.A</p>
            <h2 className="max-w-2xl text-3xl sm:text-5xl md:text-6xl font-medium leading-[1.12] sm:leading-[1.08] tracking-[-0.03em]">
              Você pede.<br />Ela executa.
            </h2>
            <p className="mt-5 max-w-md text-base sm:text-lg leading-relaxed text-muted-foreground sm:mt-7">
              Cadastre clientes, consulte o catálogo e crie pedidos apenas conversando.
            </p>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section id="comecar" className="relative overflow-hidden px-6 py-28 text-center sm:py-40 md:py-52">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] sm:h-[600px] sm:w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[140px]" />
        <Reveal>
          <h2 className="relative mx-auto max-w-4xl text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] sm:leading-[1.05] tracking-[-0.035em]">
            O futuro do seu<br />negócio começa aqui.
          </h2>
          <Link to="/entrar" onClick={() => window.__lovableEvents?.track?.("project.cta_clicked", { cta: "criar_conta" })} className="group relative mt-8 sm:mt-12 inline-flex items-center gap-3 rounded-full bg-foreground px-9 py-4 text-sm font-medium text-background transition hover:bg-primary">
            Criar minha conta <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>

      <footer className="border-t border-border bg-background/40 py-12 px-6">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <BonaParticleAtom className="h-8 w-8 text-primary" />
            <span className="font-sans font-light tracking-[0.26em] text-sm sm:text-base leading-none text-foreground uppercase">
              BONASOFT
            </span>
            <span className="text-muted-foreground/50 pl-2.5 border-l border-border/60 text-xs font-mono">
              HUG
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
