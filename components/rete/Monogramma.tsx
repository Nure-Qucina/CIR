import Image from "next/image";
import { cn } from "@/lib/utils/cn";

const TONI = [
  "bg-teal text-cream",
  "bg-orange text-ink",
  "bg-ink text-cream",
  "bg-cream-dark text-teal-700",
];

function iniziali(nome: string): string {
  const parole = nome
    .replace(/\(.*?\)/g, "")
    .replace(/^(avv|dott|dott\.ssa|dr|prof)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  return parole
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function tono(nome: string): string {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONI[h % TONI.length];
}

/**
 * Logo, foto o — se mancano — monogramma con le iniziali su un colore del
 * brand (sempre lo stesso per lo stesso nome). `forma`: tondo per le persone
 * e gli sponsor, quadrato arrotondato per aziende e studi.
 */
export function Monogramma({
  nome,
  src,
  size,
  forma = "tondo",
  className,
}: {
  nome: string;
  src?: string;
  size: number;
  forma?: "tondo" | "quadrato";
  className?: string;
}) {
  const r = forma === "tondo" ? "rounded-full" : "rounded-xl";
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        sizes={`${size}px`}
        className={cn(
          r,
          "shrink-0 object-cover",
          forma === "quadrato" && "bg-cream-50 object-contain",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        r,
        "grid shrink-0 place-items-center font-extrabold",
        tono(nome),
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.3) }}
    >
      {iniziali(nome)}
    </span>
  );
}
