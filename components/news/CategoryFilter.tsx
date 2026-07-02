import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Categoria } from "@/lib/content/types";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/i18n/routing";

/**
 * Filtro categorie come link (SSG-friendly, condivisibile): "Tutti" → /news,
 * ogni categoria → /news/categoria/[slug]. `attiva` evidenzia la corrente.
 */
export async function CategoryFilter({
  categorie,
  attiva,
  locale,
}: {
  categorie: Categoria[];
  attiva?: string;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "news" });

  const chip = (active: boolean) =>
    cn(
      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
      active
        ? "bg-teal text-white"
        : "bg-cream-200 text-ink-soft hover:bg-cream-300 hover:text-ink",
    );

  return (
    <nav aria-label={t("filtraPerCategoria")} className="flex flex-wrap gap-2">
      <Link href="/news" className={chip(!attiva)}>
        {t("tutti")}
      </Link>
      {categorie.map((c) => (
        <Link
          key={c.slug}
          href={`/news/categoria/${c.slug}`}
          className={chip(attiva === c.slug)}
          aria-current={attiva === c.slug ? "page" : undefined}
        >
          {c.nome}
        </Link>
      ))}
    </nav>
  );
}
