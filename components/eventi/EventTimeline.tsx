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
 * griglia di card medie raggruppate per anno (copertina in primo piano con la
 * data sopra), così se ne vedono parecchi senza perdere le copertine.
 * Filtri con stato nell'URL.
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
            <ol className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
              {delAnno.map((e) => (
                <li key={e.slug}>
                  <CartaEvento evento={e} />
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Card dell'archivio: la copertina viene prima di tutto (grande, in alto, con
 * la data appoggiata sopra come un bigliettino), sotto solo titolo e luogo.
 */
function CartaEvento({ evento }: { evento: EventoView }) {
  const t = useTranslations("common");
  const luogo = [evento.luogo.nome, evento.luogo.citta]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="foglio group relative flex h-full flex-col rounded-[3px] p-2 pb-3 sm:p-2.5 sm:pb-4">
      <div className="relative">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[2px]">
          <CoverImage
            src={evento.copertina}
            alt=""
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 45vw, 380px"
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        {/* La data sta a cavallo del bordo inferiore: non copre la locandina. */}
        <time
          dateTime={isoDate(evento.dataInizio)}
          className="bg-cream-50 absolute start-2 bottom-0 translate-y-1/2 rounded-[3px] px-2 py-1.5 text-center leading-none shadow-[0_4px_10px_rgb(42_31_14/0.25)] sm:px-2.5"
        >
          <span className="text-ink block font-serif text-xl font-semibold sm:text-2xl">
            {dayIt(evento.dataInizio)}
          </span>
          <span className="mt-0.5 block text-[0.65rem] font-semibold tracking-wider text-orange-700 uppercase sm:text-xs">
            {monthShortIt(evento.dataInizio)}
          </span>
        </time>
      </div>
      <div className="flex flex-1 flex-col px-1 pt-9 sm:px-1.5 sm:pt-10">
        <h3 className="text-ink line-clamp-2 min-h-[2lh] text-sm leading-snug font-bold sm:text-base">
          {/* Il link copre tutta la card (stretched link). */}
          <Link
            href={`/eventi/${evento.slug}`}
            className="underline-offset-4 group-hover:underline after:absolute after:inset-0"
          >
            {evento.titolo}
          </Link>
          {evento.isFallback && <LangBadge className="ms-2 align-middle" />}
        </h3>
        <p className="text-ink-soft mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm">
          {luogo && (
            <>
              <MapPin size={13} className="text-teal shrink-0" aria-hidden />
              <span className="truncate">{luogo}</span>
            </>
          )}
          {!evento.tuttoIlGiorno && (
            <span className="hidden shrink-0 sm:inline">
              {luogo && "· "}
              {formatTimeIt(evento.dataInizio)}
            </span>
          )}
        </p>
        <span className="mt-auto hidden items-center gap-1 pt-2 text-xs font-semibold text-teal-700 sm:inline-flex">
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
