import "server-only";
import { cache } from "react";
import { reader } from "./reader";
import type { Evento, EventoStato } from "./types";
import { formatDateIt } from "@/lib/utils/date";
import { routing, type Locale } from "@/i18n/routing";

/** Evento arricchito con i campi derivati a runtime (§3.1). */
export type EventoView = Evento & {
  isPast: boolean;
  dataLabel: string; // data formattata it-IT
};

/**
 * Campi neutri (date, luogo, copertina, categoria, stato, inEvidenza) sono
 * uguali per tutte le lingue. I campi localizzati (titolo, estratto,
 * descrizione, CTA label, SEO) vivono in italiano nei campi principali —
 * invariati — e nelle altre lingue in `traduzioni.<locale>` (opzionali).
 * Se la traduzione manca, si ricade sull'italiano con `isFallback: true`
 * (§5-6 brief i18n).
 */
function toEvento(
  slug: string,
  entry: Record<string, unknown>,
  locale: Locale,
): Evento {
  const luogo = (entry.luogo ?? {}) as Record<string, unknown>;
  const cta = (entry.ctaEsterna ?? {}) as Record<string, unknown>;
  const seo = (entry.seo ?? {}) as Record<string, unknown>;
  const traduzioni = (entry.traduzioni ?? {}) as Record<
    string,
    Record<string, unknown> | undefined
  >;
  const t = locale === routing.defaultLocale ? undefined : traduzioni[locale];
  const tradotto = Boolean((t?.titolo as string | undefined)?.trim());

  const titoloIt = String(entry.titolo ?? "");
  const estrattoIt = String(entry.estratto ?? "");
  const descrizioneIt = (entry.descrizione as string | null) ?? undefined;
  const ctaLabelIt = (cta.label as string | null) ?? undefined;
  const seoTitleIt = (seo.title as string) || undefined;
  const seoDescriptionIt = (seo.description as string) || undefined;

  return {
    slug,
    titolo: tradotto ? String(t!.titolo) : titoloIt,
    stato: (entry.stato as EventoStato) ?? "programmato",
    dataInizio: String(entry.dataInizio ?? ""),
    dataFine: (entry.dataFine as string | null) ?? undefined,
    tuttoIlGiorno: Boolean(entry.tuttoIlGiorno),
    luogo: {
      nome: String(luogo.nome ?? ""),
      indirizzo: String(luogo.indirizzo ?? ""),
      citta: String(luogo.citta ?? "Roma"),
      lat: (luogo.lat as number | null) ?? undefined,
      lng: (luogo.lng as number | null) ?? undefined,
    },
    estratto:
      tradotto && (t?.estratto as string)?.trim()
        ? String(t!.estratto)
        : estrattoIt,
    descrizione:
      tradotto && (t?.descrizione as string)?.trim()
        ? String(t!.descrizione)
        : descrizioneIt,
    copertina: (entry.copertina as string | null) ?? undefined,
    categoria: (entry.categoria as string | null) ?? undefined,
    ctaEsterna: cta.url
      ? {
          label:
            (tradotto && (t?.ctaLabel as string)?.trim()
              ? String(t!.ctaLabel)
              : ctaLabelIt) ?? "",
          url: String(cta.url ?? ""),
        }
      : undefined,
    inEvidenza: Boolean(entry.inEvidenza),
    seo: {
      title:
        tradotto && (t?.seoTitle as string)?.trim()
          ? String(t!.seoTitle)
          : seoTitleIt,
      description:
        tradotto && (t?.seoDescription as string)?.trim()
          ? String(t!.seoDescription)
          : seoDescriptionIt,
      ogImage: (seo.ogImage as string) || undefined,
    },
    isFallback: !tradotto,
    originalLocale: tradotto ? locale : routing.defaultLocale,
  };
}

function enrich(e: Evento): EventoView {
  // Confronto deterministico: interpretiamo il wall-clock come UTC (+"Z").
  const ref = e.dataFine ?? e.dataInizio;
  const isPast = ref ? new Date(`${ref}:00Z`).getTime() < Date.now() : false;
  return {
    ...e,
    isPast,
    dataLabel: e.dataInizio ? formatDateIt(e.dataInizio) : "",
  };
}

/**
 * Tutti gli eventi (senza corpo MDX) nella lingua richiesta (fallback IT se
 * non tradotti). Ordine: prossimi prima, poi passati.
 */
export const getEventi = cache(
  async (locale: Locale = routing.defaultLocale): Promise<EventoView[]> => {
    // [DIAG-TEMP] Logging diagnostico temporaneo — incident response runtime ISR.
    // Vedi REPORT-FORENSE-FRONTEND-DATA-PIPELINE.md. Da rimuovere a diagnosi conclusa.
    console.log(
      "[DIAG-TEMP][getEventi][pre]",
      JSON.stringify({
        timestamp: new Date().toISOString(),
        route: "getEventi",
        cwd: process.cwd(),
        pid: process.pid,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        NODE_ENV: process.env.NODE_ENV,
      }),
    );
    console.log("[DIAG-TEMP][getEventi] START reader.collections.eventi.all()");
    let entries: Awaited<ReturnType<typeof reader.collections.eventi.all>>;
    try {
      entries = await reader.collections.eventi.all();
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      console.error(
        "[DIAG-TEMP][getEventi][EXCEPTION]",
        JSON.stringify({
          message: e?.message,
          stack: e?.stack,
          code: e?.code,
          errno: e?.errno,
          path: e?.path,
          syscall: e?.syscall,
        }),
      );
      throw err;
    }
    console.log(
      "[DIAG-TEMP][getEventi] END reader",
      JSON.stringify({
        numeroElementi: entries.length,
        slug: entries.map((e) => e.slug),
      }),
    );
    if (entries.length === 0) {
      console.warn(
        "[DIAG-TEMP][getEventi][ATTENZIONE] reader ha restituito array vuoto",
        JSON.stringify({
          cwd: process.cwd(),
          directory: "content/eventi",
          timestamp: new Date().toISOString(),
        }),
      );
    }
    // Le bozze non entrano mai nel modello pubblico: filtrate qui, alla
    // fonte, così ogni consumatore (liste, home, ICS…) le esclude gratis.
    const eventi = entries
      .filter((e) => !(e.entry as Record<string, unknown>).bozza)
      .map((e) =>
        enrich(toEvento(e.slug, e.entry as Record<string, unknown>, locale)),
      );

    const upcoming = eventi
      .filter((e) => !e.isPast)
      .sort(
        (a, b) =>
          new Date(a.dataInizio).getTime() - new Date(b.dataInizio).getTime(),
      );
    const past = eventi
      .filter((e) => e.isPast)
      .sort(
        (a, b) =>
          new Date(b.dataInizio).getTime() - new Date(a.dataInizio).getTime(),
      );
    return [...upcoming, ...past];
  },
);

export const getEventiInEvidenza = cache(
  async (locale: Locale = routing.defaultLocale): Promise<EventoView[]> => {
    const eventi = await getEventi(locale);
    return eventi.filter((e) => e.inEvidenza);
  },
);

/** Evento singolo + corpo MDX risolto (stringa raw), nella lingua richiesta. */
export const getEventoBySlug = cache(
  async (
    slug: string,
    locale: Locale = routing.defaultLocale,
  ): Promise<EventoView | null> => {
    const entry = await reader.collections.eventi.read(slug, {
      resolveLinkedFiles: true,
    });
    if (!entry) return null;
    // Bozza = invisibile anche via link diretto: la pagina fa notFound().
    if ((entry as unknown as Record<string, unknown>).bozza) return null;
    const base = toEvento(
      slug,
      entry as unknown as Record<string, unknown>,
      locale,
    );
    return enrich(base);
  },
);

export const getEventiSlugs = cache(async (): Promise<string[]> => {
  const entries = await reader.collections.eventi.all();
  // Niente bozze: qui passano generateStaticParams e sitemap.
  return entries
    .filter((e) => !(e.entry as Record<string, unknown>).bozza)
    .map((e) => e.slug);
});

/** Lingue in cui l'evento è realmente tradotto (IT sempre incluso) — per hreflang (§9 brief i18n). */
export const getEventoAvailableLocales = cache(
  async (slug: string): Promise<Locale[]> => {
    const entry = await reader.collections.eventi.read(slug);
    if (!entry) return [routing.defaultLocale];
    const traduzioni = (entry.traduzioni ?? {}) as Record<
      string,
      Record<string, unknown> | undefined
    >;
    return routing.locales.filter(
      (loc) =>
        loc === routing.defaultLocale ||
        Boolean((traduzioni[loc]?.titolo as string | undefined)?.trim()),
    );
  },
);
