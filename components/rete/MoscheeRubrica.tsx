"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  Clock,
  List,
  Map as MapIcon,
  MapPin,
  Phone,
  Search,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import { ZONE_ROMA } from "@/lib/content/rete-opzioni";
import type { Moschea } from "@/lib/content/rete";
import { mapsUrl, telHref as tel } from "@/lib/content/rete-link";
import { Chip } from "./Chip";

// Leaflet tocca `window`: solo lato client.
const MappaMoschee = dynamic(() => import("./MappaMoschee"), {
  ssr: false,
  loading: () => <div className="bg-cream-dark h-full w-full animate-pulse" />,
});

const mapsHref = (m: Moschea) => mapsUrl(m);

/**
 * Rubrica delle moschee per zona + mappa. Filtri (zona, ricerca) valgono per
 * entrambe; «Sulla mappa» accende il punto e toccando un punto si evidenzia
 * la riga. Su telefono la mappa parte chiusa ed è dietro «Mostra la mappa».
 */
export function MoscheeRubrica({ moschee }: { moschee: Moschea[] }) {
  const t = useTranslations("rete.moschee");
  const tz = useTranslations("rete.zone");
  const tzs = useTranslations("rete.zoneSotto");
  const ts = useTranslations("rete.servizi");
  const tl = useTranslations("rete.lingue");

  const [zona, setZona] = useState<string>("tutte");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [mappaAperta, setMappaAperta] = useState(false);

  const filtrate = useMemo(() => {
    const testo = q.trim().toLocaleLowerCase();
    return moschee.filter(
      (m) =>
        (zona === "tutte" || m.zona === zona) &&
        (!testo ||
          [
            m.nome,
            m.quartiere,
            m.indirizzo,
            m.associazione,
            `municipio ${m.municipio}`,
          ]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase()
            .includes(testo)),
    );
  }, [moschee, zona, q]);

  const punti = useMemo(
    () =>
      filtrate
        .filter((m) => m.posizione)
        .map((m) => ({
          slug: m.slug,
          nome: m.nome,
          lat: m.posizione!.lat,
          lng: m.posizione!.lng,
        })),
    [filtrate],
  );
  const haMappa = moschee.some((m) => m.posizione);
  const scelta = filtrate.find((m) => m.slug === sel && m.posizione);

  const zonePresenti = ZONE_ROMA.filter((z) =>
    moschee.some((m) => m.zona === z.value),
  );
  const gruppi = zonePresenti
    .map((z) => ({
      zona: z.value,
      moschee: filtrate.filter((m) => m.zona === z.value),
    }))
    .filter((g) => g.moschee.length > 0);

  const mostraSullaMappa = (slug: string) => {
    setSel(slug);
    setMappaAperta(true);
    document
      .getElementById("mappa-moschee")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filtri */}
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex w-full max-w-md flex-col gap-2">
          <label
            htmlFor="cerca-moschee"
            className="text-ink text-sm font-semibold"
          >
            {t("cercaLabel")}
          </label>
          <div className="bg-cream-50 focus-within:outline-teal flex items-center gap-2.5 rounded-full border border-[#d3bb98] px-4 focus-within:outline-2">
            <Search size={18} className="text-teal shrink-0" aria-hidden />
            <input
              id="cerca-moschee"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("cercaPlaceholder")}
              className="text-ink placeholder:text-ink-soft/70 min-w-0 flex-1 bg-transparent py-3 text-[15px] outline-none"
            />
          </div>
        </div>
        <div
          role="group"
          aria-label={t("filtroZona")}
          className="-mx-4 flex max-w-[calc(100%+2rem)] min-w-0 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:max-w-full sm:flex-wrap sm:px-0"
        >
          <Chip attivo={zona === "tutte"} onClick={() => setZona("tutte")}>
            {t("tutte")}
          </Chip>
          {zonePresenti.map((z) => (
            <Chip
              key={z.value}
              attivo={zona === z.value}
              onClick={() => setZona(z.value)}
            >
              {tz(z.value)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Mappa */}
      {haMappa && (
        <>
          <button
            type="button"
            onClick={() => setMappaAperta((v) => !v)}
            aria-expanded={mappaAperta}
            aria-controls="mappa-moschee"
            className="bg-cream-dark flex min-h-12 items-center justify-center gap-2 rounded-md text-sm font-bold text-teal-700 md:hidden"
          >
            {mappaAperta ? (
              <List size={18} aria-hidden />
            ) : (
              <MapIcon size={18} aria-hidden />
            )}
            {mappaAperta ? t("mostraElenco") : t("mostraMappa")}
          </button>
          <section
            id="mappa-moschee"
            aria-label={t("mappa")}
            className={cn(
              "relative isolate h-[60vh] overflow-hidden rounded-md shadow-[0_10px_30px_-14px_rgb(42_31_14/0.35)] md:block md:h-[420px]",
              mappaAperta ? "block" : "hidden",
            )}
          >
            <MappaMoschee
              punti={punti}
              selezionato={scelta?.slug ?? null}
              onSeleziona={setSel}
              visibile={mappaAperta}
              etichetta={t("mappa")}
            />
            {scelta && (
              <article className="bg-cream-50 absolute inset-x-3 bottom-3 z-[1000] flex flex-col gap-2.5 rounded-xl p-4 shadow-[0_14px_34px_-12px_rgb(42_31_14/0.5)] md:inset-x-auto md:start-auto md:end-4 md:top-4 md:bottom-auto md:w-80">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold tracking-[0.14em] text-teal-700 uppercase">
                      {t("municipio", { m: scelta.municipio })}
                    </p>
                    <h2 className="text-ink mt-1 text-lg leading-tight font-extrabold">
                      {scelta.nome}
                    </h2>
                    <p className="text-ink-soft mt-1 text-sm">
                      {[scelta.indirizzo, scelta.quartiere]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSel(null)}
                    aria-label={t("chiudiScheda")}
                    className="text-ink-soft hover:bg-cream-dark -me-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full"
                  >
                    <X size={18} aria-hidden />
                  </button>
                </div>
                {scelta.venerdi && (
                  <span className="self-start rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-800">
                    {t("venerdi", { ora: scelta.venerdi })}
                  </span>
                )}
                <div className="flex gap-2">
                  <a
                    href={mapsHref(scelta)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-orange text-ink hover:bg-orange-dark flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-bold"
                  >
                    {t("indicazioni")}
                  </a>
                  {scelta.contatti.telefono && (
                    <a
                      href={tel(scelta.contatti.telefono)}
                      className="ring-teal flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-bold text-teal-700 ring-[1.5px] ring-inset hover:bg-teal-50"
                    >
                      {t("chiama")}
                    </a>
                  )}
                </div>
              </article>
            )}
          </section>
          <p className="text-ink-soft -mt-3 text-xs">{t("mappaNota")}</p>
        </>
      )}

      <p className="text-ink-soft text-sm" aria-live="polite">
        {t("conteggio", { n: filtrate.length })}
      </p>

      {/* Elenco per zona */}
      {gruppi.map((g) => (
        <section
          key={g.zona}
          className="flex flex-col gap-3"
          aria-labelledby={`zona-${g.zona}`}
        >
          <h2
            id={`zona-${g.zona}`}
            className="border-orange flex flex-wrap items-baseline gap-3 self-start border-b-2 pb-1.5"
          >
            <span className="text-sm font-extrabold tracking-[0.14em] text-teal-700 uppercase">
              {tz(g.zona)}
            </span>
            <span className="text-ink-soft text-[13px]">{tzs(g.zona)}</span>
          </h2>
          <ul className="flex flex-col gap-3">
            {g.moschee.map((m) => (
              <li key={m.slug}>
                <article
                  className={cn(
                    "foglio flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-5",
                    scelta?.slug === m.slug && "ring-orange ring-2",
                  )}
                >
                  <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5">
                    <h3 className="text-ink text-[17px] font-bold">{m.nome}</h3>
                    <p className="text-ink-soft flex items-center gap-1.5 text-sm">
                      <MapPin
                        size={15}
                        className="text-teal shrink-0"
                        aria-hidden
                      />
                      {[
                        m.indirizzo ?? m.quartiere,
                        t("municipio", { m: m.municipio }),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <ul
                    className="flex min-w-0 flex-[1_1_280px] flex-wrap gap-1.5"
                    aria-label="Servizi"
                  >
                    {m.venerdi && (
                      <li className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-[13px] font-bold text-orange-800">
                        <Clock size={13} aria-hidden />
                        {t("venerdi", { ora: m.venerdi })}
                      </li>
                    )}
                    {m.servizi.map((s) => (
                      <li
                        key={s}
                        className="rounded-full bg-teal-100 px-3 py-1 text-[13px] font-semibold text-teal-800"
                      >
                        {ts(s)}
                      </li>
                    ))}
                    {m.lingueKhutba.length > 0 && (
                      <li className="bg-cream-dark text-ink rounded-full px-3 py-1 text-[13px] font-semibold">
                        {t("khutba", {
                          lingue: m.lingueKhutba.map((l) => tl(l)).join(", "),
                        })}
                      </li>
                    )}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    {m.posizione && (
                      <button
                        type="button"
                        onClick={() => mostraSullaMappa(m.slug)}
                        className="ring-teal min-h-11 rounded-full px-4 text-sm font-bold text-teal-700 ring-[1.5px] ring-inset hover:bg-teal-50"
                      >
                        {t("sullaMappa")}
                      </button>
                    )}
                    {m.indirizzo ? (
                      <a
                        href={mapsHref(m)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-orange text-ink hover:bg-orange-dark inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold"
                      >
                        {t("indicazioni")}
                      </a>
                    ) : m.contatti.telefono ? (
                      <a
                        href={tel(m.contatti.telefono)}
                        className="bg-orange text-ink hover:bg-orange-dark inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold"
                      >
                        <Phone size={15} aria-hidden />
                        {t("chiama")}
                      </a>
                    ) : (
                      <span className="text-ink-soft self-center text-sm">
                        {t("indirizzoSuRichiesta")}
                      </span>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {filtrate.length === 0 && (
        <p className="bg-cream-50 text-ink-soft rounded-md p-6">
          {t("nessunRisultato")}
        </p>
      )}

      <aside className="bg-teal text-cream mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-md px-6 py-7 sm:px-8">
        <div className="flex max-w-xl flex-col gap-1.5">
          <h2 className="text-xl font-extrabold text-white">
            {t("segnalaTitolo")}
          </h2>
          <p className="text-[15px] leading-relaxed">{t("segnalaTesto")}</p>
        </div>
        <Link
          href="/contatti"
          className="bg-orange text-ink hover:bg-orange-dark inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-bold"
        >
          {t("segnalaCta")}
        </Link>
      </aside>
    </div>
  );
}
