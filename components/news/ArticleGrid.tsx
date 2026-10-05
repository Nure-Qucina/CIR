import { getTranslations } from "next-intl/server";
import type { Articolo, Categoria } from "@/lib/content/types";
import { ArticleCard } from "./ArticleCard";
import type { Locale } from "@/i18n/routing";

/**
 * Griglia responsive di articoli; risolve la categoria per ogni card.
 * Le card sono "storte" (leggermente inclinate) come fogli sparsi.
 */
export async function ArticleGrid({
  articoli,
  categorieMap,
  locale,
}: {
  articoli: Articolo[];
  categorieMap: Map<string, Categoria>;
  locale: Locale;
}) {
  if (articoli.length === 0) {
    const t = await getTranslations({ locale, namespace: "news" });
    return (
      <div className="foglio text-ink-soft p-10 text-center">
        {t("nessunContenuto")}
      </div>
    );
  }

  return (
    <div className="grid gap-x-7 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
      {articoli.map((a, i) => (
        <ArticleCard
          key={a.slug}
          articolo={a}
          categoria={categorieMap.get(a.categoria)}
          priority={i < 3}
          storta
          locale={locale}
        />
      ))}
    </div>
  );
}
