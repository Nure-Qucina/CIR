import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Articolo, Categoria } from "@/lib/content/types";
import { CoverImage } from "@/components/ui/CoverImage";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { formatDateIt, isoDate } from "@/lib/utils/date";
import { LangBadge } from "@/components/ui/LangBadge";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils/cn";
import { inclinazione } from "@/lib/carta";

/**
 * Card articolo come un foglio di carta: cornice crema con la copertina
 * incassata, categoria, titolo (massimo tre righe) e data. Tutte alte uguali
 * dentro la griglia. `storta` le inclina leggermente (pagina News); al
 * passaggio del mouse si raddrizzano.
 */
export async function ArticleCard({
  articolo,
  categoria,
  priority = false,
  storta = false,
  locale,
}: {
  articolo: Articolo;
  categoria?: Categoria;
  priority?: boolean;
  storta?: boolean;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "news" });

  return (
    <article
      className={cn(
        "foglio flex h-full flex-col rounded-[3px] p-2.5 pb-4 transition-transform duration-300",
        storta && [inclinazione(articolo.slug), "hover:rotate-0"],
      )}
    >
      <Link
        href={`/news/${articolo.slug}`}
        className="relative block aspect-[16/9] overflow-hidden rounded-[2px]"
        tabIndex={-1}
        aria-hidden="true"
      >
        <CoverImage
          src={articolo.copertina}
          alt={articolo.titolo}
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
        />
        {articolo.tipo === "comunicato" && (
          <span className="bg-ink text-cream absolute end-2 top-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold">
            {t("comunicato")}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-2 pt-3">
        <div className="flex min-h-6 flex-wrap items-center gap-2">
          {categoria && (
            <CategoryPill
              color={categoria.colore}
              href={`/news/categoria/${categoria.slug}`}
            >
              {categoria.nome}
            </CategoryPill>
          )}
          {articolo.isFallback && <LangBadge />}
        </div>

        {/* Tre righe fisse: le card restano tutte della stessa altezza. */}
        <h3 className="text-ink mt-3 line-clamp-3 min-h-[3lh] text-[1.05rem] leading-snug font-bold">
          <Link
            href={`/news/${articolo.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {articolo.titolo}
          </Link>
        </h3>

        <div className="text-ink-soft mt-auto flex items-center gap-3 pt-4 text-xs">
          {articolo.dataPubblicazione && (
            <time dateTime={isoDate(articolo.dataPubblicazione)}>
              {formatDateIt(articolo.dataPubblicazione)}
            </time>
          )}
          {articolo.tempoLettura ? (
            <span className="flex items-center gap-1">
              <Clock size={13} aria-hidden />
              {articolo.tempoLettura} {t("min")}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
