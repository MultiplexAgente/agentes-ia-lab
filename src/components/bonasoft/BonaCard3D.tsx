import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * BonaCard3D: Componente de Card 3D do site oficial da BonaSoft com:
 * - Inclinação 3D orgânica (rotateX, rotateY) acompanhando cursor e toque
 * - Elevação suave elástica (scale: 1.018 desktop, 1.012 touch)
 * - Retorno suave com molas de alta precisão (damping 20, stiffness 180)
 * - Iluminação Spotlight dinâmica na superfície interna
 * - Reflexo reativo em degradê nas bordas perimetrais
 * - Suporte touch seguro sem bloqueio de rolagem
 */
export function BonaCard3D({
  children,
  className,
  containerClassName,
  tiltIntensity = 6.5,
  showSpotlight = true,
  showBorderGlow = true,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  tiltIntensity?: number;
  showSpotlight?: boolean;
  showBorderGlow?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, o: 0, isTouch: false });
  const isTouchRef = useRef(false);
  const rafRef = useRef<number>(0);

  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const scaleMv = useMotionValue(1);

  // Molas suaves com física natural
  const rx = useSpring(useTransform(my, [0, 1], [tiltIntensity, -tiltIntensity]), {
    stiffness: 180,
    damping: 20,
  });
  const ry = useSpring(useTransform(mx, [0, 1], [-tiltIntensity, tiltIntensity]), {
    stiffness: 180,
    damping: 20,
  });
  const scale = useSpring(scaleMv, { stiffness: 220, damping: 22 });

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const isTouch = e.pointerType === "touch";
    isTouchRef.current = isTouch;
    const r = containerRef.current?.getBoundingClientRect();
    if (!r || r.width <= 0 || r.height <= 0) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const relX = clientX - r.left;
      const relY = clientY - r.top;
      const normX = Math.max(0, Math.min(1, relX / r.width));
      const normY = Math.max(0, Math.min(1, relY / r.height));

      const tiltScale = isTouch ? 0.65 : 1.0;
      mx.set(0.5 + (normX - 0.5) * tiltScale);
      my.set(0.5 + (normY - 0.5) * tiltScale);
      scaleMv.set(isTouch ? 1.012 : 1.018);

      setPos({
        x: relX,
        y: relY,
        o: 1,
        isTouch,
      });
    });
  };

  const handleRelease = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    mx.set(0.5);
    my.set(0.5);
    scaleMv.set(1);
    setPos((p) => ({ ...p, o: 0 }));
  };

  return (
    <div
      ref={containerRef}
      style={{
        perspective: 1000,
        touchAction: "pan-y",
        WebkitTouchCallout: "none",
      }}
      className={cn("h-full", containerClassName)}
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
      onPointerUp={handleRelease}
      onPointerCancel={handleRelease}
      onPointerLeave={handleRelease}
      onContextMenu={(e) => {
        if (isTouchRef.current) {
          e.preventDefault();
        }
      }}
    >
      <motion.div
        style={{
          rotateX: rx,
          rotateY: ry,
          scale,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "relative h-full overflow-hidden transition-colors duration-300",
          className
        )}
      >
        {/* Superfície luminosa dinâmica (Spotlight acompanhando cursor/toque) */}
        {showSpotlight && (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
            style={{
              opacity: pos.o,
              background: `radial-gradient(${
                pos.isTouch ? "300px" : "380px"
              } circle at ${pos.x}px ${pos.y}px, rgba(16, 185, 129, 0.16), transparent 70%)`,
            }}
          />
        )}

        {/* Reflexo luminoso nas bordas acompanhando o toque ou cursor */}
        {showBorderGlow && (
          <div
            className="pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 z-10"
            style={{
              opacity: pos.o,
              background: `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, rgba(16, 185, 129, 0.65), transparent 65%)`,
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              padding: "1px",
            }}
          />
        )}

        {/* Conteúdo interno preservado e interativo */}
        <div className="relative h-full z-0">{children}</div>
      </motion.div>
    </div>
  );
}
