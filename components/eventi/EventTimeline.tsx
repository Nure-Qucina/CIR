"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, MapPin } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import type { EventoView } from "@/lib/content/eventi";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { CoverImage } from "@/components/ui/CoverImage";
import { LangBadge } from "@/components/ui/LangBadge";
import { EventCard } from "./EventCard";
import {
  dayIt,
  formatTimeIt,
  isoDate,
  monthShortIt,
  yearOf,
} from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

type Filtro = "prossimi" | "passati" | "tutti";

const FILTRI: Filtro[] = ["prossimi", "passati", "tutti"];

/**
 * Pagina eventi: gli eventi in programma in card grandi, l'archivio come
 * elenco compatto raggruppato per anno (data in evidenza + miniatura), così
 * in uno schermo se ne vedono molti. Filtri con stato nell'URL.
 * L'ordine arriva già da getEventi: futuri dal più vicino, passati dal più recente.
 */
export function EventTimeline({ eventi }: { eventi: EventoView[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("eventi");

  const filtroLabel: Record<Filtro, string> = {
    prossimi: t("filtroProssimi"),
    passati: t("filtroPassati"),
    tutti: t("filtroTutti"),
  };

  const filtro: Filtro =
    (params.get("filtro") as Filtro) &&
    FILTRI.includes(params.get("filtro") as Filtro)
      ? (params.get("filtro") as Filtro)
      : "tutti";

  const prossimi = useMemo(() => eventi.filter((e) => !e.isPast), [eventi]);
  const passati = useMemo(() => eventi.filter((e) => e.isPast), [eventi]);

  const mostraProssimi = filtro !== "passati" && prossimi.length > 0;
  const mostraPassati = filtro !== "prossimi" && passati.length > 0;
  const vuoto =
    (filtro === "prossimi" && prossimi.length === 0) ||
    (!mostraProssimi && !mostraPassati);

  function setFiltro(f: Filtro) {
    const sp = new URLSearchParams(params.toString());
    if (f === "tutti") sp.delete("filtro");
    else sp.set("filtro", f);
    const qs = sp.toString();
    router.replace(qs ? `/eventi?${qs}` : "/eventi", { scroll: false });
  }

  return (
    <div>
      {/* Filtri chip — stato in URL per condivisibilità */}
      <div
        className="mb-10 flex flex-wrap gap-2"
        role="group"
        aria-label={t("filtraEventi")}
      >
        {FILTRI.map((f) => {
          const active = f === filtro;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFiltro(f)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-teal text-white"
                  : "bg-cream-200 text-ink-soft hover:bg-cream-300 hover:text-ink",
              )}
            >
              {filtroLabel[f]}
            </button>
          );
        })}
      </div>

      {vuoto && <EmptyState />}

      {mostraProssimi && (
        <section aria-labelledby="eventi-prossimi" className="mb-14">
          <h2
            id="eventi-prossimi"
            className="text-ink mb-6 text-[length:var(--text-h3)] font-bold"
          >
            {t("inProgramma")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {prossimi.map((e) => (
              <EventCard key={e.slug} evento={e} />
            ))}
          </div>
        </section>
      )}

      {mostraPassati && <Archivio eventi={passati} />}
    </div>
  );
}

function Archivio({ eventi }: { eventi: EventoView[] }) {
  const t = useTranslations("eventi");
  // Gruppi per anno, nell'ordine ricevuto (più recente prima).
  const anni: { anno: number; eventi: EventoView[] }[] = [];
  for (const e of eventi) {
    const anno = yearOf(e.dataInizio);
    const ultimo = anni[anni.length - 1];
    if (ultimo && ultimo.anno === anno) ultimo.eventi.push(e);
    else anni.push({ anno, eventi: [e] });
  }

  return (
    <section aria-labelledby="eventi-archivio">
      <h2
        id="eventi-archivio"
        className="text-ink mb-6 text-[length:var(--text-h3)] font-bold"
      >
        {t("archivio")}
      </h2>
      <div className="space-y-10">
        {anni.map(({ anno, eventi: delAnno }) => (
          <div key={anno}>
            <p className="mb-3 font-serif text-2xl font-semibold text-orange-700">
              {anno}
            </p>
            <ol className="grid gap-3 lg:grid-cols-2 lg:gap-4">
              {delAnno.map((e) => (
                <li key={e.slug}>
                  <RigaEvento evento={e} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Riga compatta dell'archivio: data, miniatura, titolo e luogo. */
function RigaEvento({ evento }: { evento: EventoView }) {
  const t = useTranslations("common");
  const luogo = [evento.luogo.nome, evento.luogo.citta]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="foglio group relative grid grid-cols-[48px_88px_1fr] items-center gap-3 rounded-[3px] p-2.5 sm:grid-cols-[60px_128px_1fr] sm:gap-4">
      <time
        dateTime={isoDate(evento.dataInizio)}
        className="text-center leading-none"
      >
        <span className="text-ink block font-serif text-3xl font-semibold">
          {dayIt(evento.dataInizio)}
        </span>
        <span className="mt-1 block text-xs font-semibold tracking-wider text-orange-700 uppercase">
          {monthShortIt(evento.dataInizio)}
        </span>
      </time>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2px]">
        <CoverImage
          src={evento.copertina}
          alt=""
          sizes="(max-width: 640px) 88px, 128px"
        />
      </div>
      <div className="min-w-0 py-1 pe-2">
        <h3 className="text-ink line-clamp-2 text-[0.95rem] leading-snug font-bold sm:text-base">
          {/* Il link copre tutta la riga (stretched link). */}
          <Link
            href={`/eventi/${evento.slug}`}
            className="underline-offset-4 group-hover:underline after:absolute after:inset-0"
          >
            {evento.titolo}
          </Link>
          {evento.isFallback && <LangBadge className="ms-2 align-middle" />}
        </h3>
        <p className="text-ink-soft mt-1 flex items-center gap-1.5 text-xs sm:text-sm">
          {luogo && (
            <>
              <MapPin size={13} className="text-teal shrink-0" aria-hidden />
              <span className="truncate">{luogo}</span>
            </>
          )}
          {!evento.tuttoIlGiorno && (
            <span className="shrink-0">
              {luogo && "· "}
              {formatTimeIt(evento.dataInizio)}
            </span>
          )}
        </p>
        <span className="mt-1 hidden items-center gap-1 text-xs font-semibold text-teal-700 sm:inline-flex">
          {t("dettagli")}
          <ArrowRight size={13} className="rtl:rotate-180" aria-hidden />
        </span>
      </div>
    </article>
  );
}

function EmptyState() {
  const t = useTranslations("eventi");
  return (
    <div className="foglio mb-14 p-10 text-center">
      <p className="text-ink text-lg font-semibold">{t("emptyTitolo")}</p>
      <p className="text-ink-soft mx-auto mt-2 max-w-md">{t("emptyBody")}</p>
      <a
        href="https://www.instagram.com/comunita_islamica_roma/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-orange text-ink hover:bg-orange-dark mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
      >
        <InstagramIcon size={16} />
        {t("seguiciSuInstagram")}
      </a>
    </div>
  );
}
