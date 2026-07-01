import type { Articolo, Categoria } from "@/lib/content/types";
import { ArticleCard } from "./ArticleCard";

/** Griglia responsive di articoli; risolve la categoria per ogni card. */
export function ArticleGrid({
  articoli,
  categorieMap,
}: {
  articoli: Articolo[];
  categorieMap: Map<string, Categoria>;
}) {
  if (articoli.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-cream-50 p-10 text-center text-ink-soft">
        Nessun contenuto in questa sezione, per ora. Torna presto.
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articoli.map((a, i) => (
        <ArticleCard
          key={a.slug}
          articolo={a}
          categoria={categorieMap.get(a.categoria)}
          priority={i < 3}
        />
      ))}
    </div>
  );
}
