import { cn } from "@/lib/utils/cn";

/**
 * Motivo geometrico islamico (firma del brand) — tassellatura a stella a 8 punte
 * disegnata da zero come SVG (nessun asset di terzi). Scala nitido, pesa pochi byte.
 *
 * Usi:
 *  - watermark leggero (opacity 4–8%) nelle sezioni crema → `as="watermark"`
 *  - dettaglio decorativo (hero/footer) → `as="accent"`
 *
 * Il pattern è un `<pattern>` SVG ripetuto: una stella a 8 punte (khatam)
 * formata da due quadrati ruotati, con un piccolo rombo di raccordo.
 */

type Props = {
  className?: string;
  /** Colore del tratto (default: currentColor → erediti il colore dal contenitore). */
  color?: string;
  /** Dimensione della cella del pattern in px. */
  size?: number;
  /** Spessore del tratto. */
  strokeWidth?: number;
  /** id univoco se ci sono più pattern nella stessa pagina. */
  id?: string;
};

export function GeometricPattern({
  className,
  color = "currentColor",
  size = 80,
  strokeWidth = 1.25,
  id = "cir-girih",
}: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none select-none", className)}
      width="100%"
      height="100%"
    >
      <defs>
        <pattern
          id={id}
          x="0"
          y="0"
          width={size}
          height={size}
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          >
            {/* Stella a 8 punte: due quadrati sovrapposti, uno ruotato di 45°. */}
            <rect
              x={size * 0.2}
              y={size * 0.2}
              width={size * 0.6}
              height={size * 0.6}
            />
            <rect
              x={size * 0.2}
              y={size * 0.2}
              width={size * 0.6}
              height={size * 0.6}
              transform={`rotate(45 ${size / 2} ${size / 2})`}
            />
            {/* Quadrato interno di raccordo. */}
            <rect
              x={size * 0.33}
              y={size * 0.33}
              width={size * 0.34}
              height={size * 0.34}
              transform={`rotate(45 ${size / 2} ${size / 2})`}
            />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
