import { cn } from "@/lib/utils";

/**
 * Logotipo vetorial oficial do Átomo BonaSoft.
 */
export function BonaLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-12 -12 24 24"
      className={cn("text-primary shrink-0 select-none", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
    >
      <circle r="2.1" fill="currentColor" stroke="none" />
      <ellipse rx="10" ry="4" />
      <ellipse rx="10" ry="4" transform="rotate(60)" />
      <ellipse rx="10" ry="4" transform="rotate(120)" />
    </svg>
  );
}
