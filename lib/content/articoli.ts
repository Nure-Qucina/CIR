import "server-only";
import { cache } from "react";
import { reader } from "./reader";
import type { Articolo, TipoArticolo } from "./types";
import { readingTime } from "@/lib/utils/readingTime";

function toArticolo(slug: string, entry: Record<string, unknown>): Articolo {
  const seo = (entry.seo ?? {}) as Record<string, unknown>;
  return {
    slug,
    titolo: String(entry.titolo ?? ""),
    estratto: String(entry.estratto ?? ""),
    categoria: String(entry.categoria ?? ""),
    tags: Array.isArray(entry.tags) ? (entry.tags as string[]) : [],
    autore: String(entry.autore ?? "Redazione CIR"),
    dataPubblicazione: String(entry.dataPubblicazione ?? ""),
    dataModifica: (entry.dataModifica as string | null) ?? null,
    copertina: (entry.copertina as string | null) ?? undefined,
    tempoLettura: (entry.tempoLettura as number | null) ?? undefined,
    inEvidenza: Boolean(entry.inEvidenza),
    tipo: (entry.tipo as TipoArticolo) ?? "articolo",
    seo: {
      title: (seo.title as string) || undefined,
      description: (seo.description as string) || undefined,
      ogImage: (seo.ogImage as string) || undefined,
    },
  };
}

type Filtri = {
  categoria?: string;
  tipo?: TipoArticolo;
  inEvidenza?: boolean;
};

/** Articoli filtrabili, ordinati per data di pubblicazione (più recenti prima). */
export const getArticoli = cache(
  async (filtri: Filtri = {}): Promise<Articolo[]> => {
    const entries = await reader.collections.articoli.all();
    let articoli = entries.map((e) =>
      toArticolo(e.slug, e.entry as Record<string, unknown>),
    );

    if (filtri.categoria)
      articoli = articoli.filter((a) => a.categoria === filtri.categoria);
    if (filtri.tipo) articoli = articoli.filter((a) => a.tipo === filtri.tipo);
    if (filtri.inEvidenza !== undefined)
      articoli = articoli.filter((a) => a.inEvidenza === filtri.inEvidenza);

    return articoli.sort(
      (a, b) =>
        new Date(b.dataPubblicazione).getTime() -
        new Date(a.dataPubblicazione).getTime(),
    );
  },
);

/** Articolo singolo con corpo MDX risolto (stringa) + tempoLettura calcolato. */
export const getArticoloBySlug = cache(
  async (slug: string): Promise<Articolo | null> => {
    const entry = await reader.collections.articoli.read(slug);
    if (!entry) return null;
    const base = toArticolo(slug, entry as unknown as Record<string, unknown>);

    // Risolvi il corpo MDX (fields.mdx → funzione async che ritorna la sorgente)
    let corpo = "";
    const raw = (entry as Record<string, unknown>).corpo;
    if (typeof raw === "function") {
      const resolved = await (raw as () => Promise<unknown>)();
      corpo =
        typeof resolved === "string"
          ? resolved
          : ((resolved as { source?: string })?.source ?? "");
    } else if (typeof raw === "string") {
      corpo = raw;
    }
    base.corpo = corpo;
    if (!base.tempoLettura && corpo) base.tempoLettura = readingTime(corpo);

    return base;
  },
);

/** Articoli correlati: stessa categoria, escluso quello corrente. */
export const getArticoliCorrelati = cache(
  async (slug: string, categoria: string, limit = 3): Promise<Articolo[]> => {
    const articoli = await getArticoli({ categoria });
    return articoli.filter((a) => a.slug !== slug).slice(0, limit);
  },
);

export const getArticoliSlugs = cache(async (): Promise<string[]> => {
  const entries = await reader.collections.articoli.all();
  return entries.map((e) => e.slug);
});
