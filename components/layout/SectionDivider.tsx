import { cn } from "@/lib/utils/cn";

/**
 * SectionDivider — separatore sottile tra sezioni, con un motivo geometrico
 * brand (nodo a stella centrale) in arancione/teal. Decorativo → aria-hidden.
 */

type Props = {
  className?: string;
  /** Colore del nodo centrale. */
  accent?: "orange" | "teal";
};

export function SectionDivider({ className, accent = "orange" }: Props) {
  const accentColor =
    accent === "orange" ? "var(--color-orange)" : "var(--color-teal)";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center gap-3 py-2 text-border",
        className,
      )}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-current" />
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.25"
        strokeLinejoin="round"
      >
        <rect x="5" y="5" width="12" height="12" />
        <rect
          x="5"
          y="5"
          width="12"
          height="12"
          transform="rotate(45 11 11)"
        />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-current" />
    </div>
  );
}
