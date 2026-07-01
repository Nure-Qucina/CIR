import Link from "next/link";
import { Clock } from "lucide-react";
import type { Articolo, Categoria } from "@/lib/content/types";
import { Card } from "@/components/ui/Card";
import { CoverImage } from "@/components/ui/CoverImage";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { formatDateIt, isoDate } from "@/lib/utils/date";

export function ArticleCard({
  articolo,
  categoria,
  priority = false,
}: {
  articolo: Articolo;
  categoria?: Categoria;
  priority?: boolean;
}) {
  return (
    <Card as="article" className="flex h-full flex-col overflow-hidden">
      <Link
        href={`/news/${articolo.slug}`}
        className="relative block aspect-[16/9] overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        <CoverImage
          src={articolo.copertina}
          alt={articolo.titolo}
          priority={priority}
        />
        {articolo.tipo === "comunicato" && (
          <span className="absolute top-3 left-3 inline-flex items-center rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream">
            Comunicato
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {categoria && (
            <CategoryPill
              color={categoria.colore}
              href={`/news/categoria/${categoria.slug}`}
            >
              {categoria.nome}
            </CategoryPill>
          )}
        </div>

        <h3 className="mt-3 text-lg leading-snug font-bold text-ink">
          <Link
            href={`/news/${articolo.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {articolo.titolo}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-soft">
          {articolo.estratto}
        </p>

        <div className="mt-4 flex items-center gap-3 text-xs text-ink-soft">
          {articolo.dataPubblicazione && (
            <time dateTime={isoDate(articolo.dataPubblicazione)}>
              {formatDateIt(articolo.dataPubblicazione)}
            </time>
          )}
          {articolo.tempoLettura ? (
            <span className="flex items-center gap-1">
              <Clock size={13} aria-hidden />
              {articolo.tempoLettura} min
            </span>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
