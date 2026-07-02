"use client";

import { useTranslations } from "next-intl";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { EventoView } from "@/lib/content/eventi";
import { Card } from "@/components/ui/Card";
import { CoverImage } from "@/components/ui/CoverImage";
import { formatDateIt, formatTimeIt, isoDate } from "@/lib/utils/date";
import { LangBadge } from "@/components/ui/LangBadge";

/** Badge stato evento: In programma (orange) / Concluso (teal). */
function StatoBadge({ isPast }: { isPast: boolean }) {
  const t = useTranslations("eventi");
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold " +
        (isPast ? "bg-teal-100 text-teal-800" : "bg-orange-100 text-orange-800")
      }
    >
      {isPast ? t("concluso") : t("inProgramma")}
    </span>
  );
}

export function EventCard({ evento }: { evento: EventoView }) {
  const t = useTranslations("common");
  const luogo = [evento.luogo.nome, evento.luogo.citta]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card as="article" className="flex h-full flex-col overflow-hidden">
      <Link
        href={`/eventi/${evento.slug}`}
        className="relative block aspect-[16/9] overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        <CoverImage src={evento.copertina} alt={evento.titolo} />
        <span className="absolute top-3 start-3">
          <StatoBadge isPast={evento.isPast} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-col gap-1.5 text-sm text-ink-soft">
          <span className="flex items-center gap-2">
            <Calendar size={15} className="text-teal" aria-hidden />
            <time dateTime={isoDate(evento.dataInizio)}>
              {formatDateIt(evento.dataInizio)}
              {!evento.tuttoIlGiorno && ` · ${formatTimeIt(evento.dataInizio)}`}
            </time>
          </span>
          {luogo && (
            <span className="flex items-center gap-2">
              <MapPin size={15} className="text-teal" aria-hidden />
              {luogo}
            </span>
          )}
        </div>

        <h3 className="mt-3 flex flex-wrap items-center gap-2 text-lg font-bold text-ink">
          <Link
            href={`/eventi/${evento.slug}`}
            className="underline-offset-4 hover:underline"
          >
            {evento.titolo}
          </Link>
          {evento.isFallback && <LangBadge />}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">
          {evento.estratto}
        </p>

        <Link
          href={`/eventi/${evento.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          {t("dettagli")}
          <ArrowRight size={15} className="rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
