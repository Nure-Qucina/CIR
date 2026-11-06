"use client";

import { cn } from "@/lib/utils/cn";

/** Pillola di filtro (zone, categorie, lingue): bottone con aria-pressed. */
export function Chip({
  attivo,
  onClick,
  children,
}: {
  attivo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attivo}
      className={cn(
        "min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors",
        attivo
          ? "bg-teal text-white"
          : "bg-cream-dark text-ink hover:bg-cream-300",
      )}
    >
      {children}
    </button>
  );
}
