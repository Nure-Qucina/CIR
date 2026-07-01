import "server-only";
import { cache } from "react";
import { reader } from "./reader";
import type { Evento, EventoStato } from "./types";
import { formatDateIt } from "@/lib/utils/date";

/** Evento arricchito con i campi derivati a runtime (§3.1). */
export type EventoView = Evento & {
  isPast: boolean;
  dataLabel: string; // data formattata it-IT
};

function toEvento(slug: string, entry: Record<string, unknown>): Evento {
  const luogo = (entry.luogo ?? {}) as Record<string, unknown>;
  const cta = (entry.ctaEsterna ?? {}) as Record<string, unknown>;
  const seo = (entry.seo ?? {}) as Record<string, unknown>;
  return {
    slug,
    titolo: String(entry.titolo ?? ""),
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
    estratto: String(entry.estratto ?? ""),
    descrizione: (entry.descrizione as string | null) ?? undefined,
    copertina: (entry.copertina as string | null) ?? undefined,
    categoria: (entry.categoria as string | null) ?? undefined,
    ctaEsterna: cta.label
      ? { label: String(cta.label), url: String(cta.url ?? "") }
      : undefined,
    inEvidenza: Boolean(entry.inEvidenza),
    seo: {
      title: (seo.title as string) || undefined,
      description: (seo.description as string) || undefined,
      ogImage: (seo.ogImage as string) || undefined,
    },
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

/** Tutti gli eventi (senza corpo MDX). Ordine: prossimi prima, poi passati. */
export const getEventi = cache(async (): Promise<EventoView[]> => {
  const entries = await reader.collections.eventi.all();
  const eventi = entries.map((e) =>
    enrich(toEvento(e.slug, e.entry as Record<string, unknown>)),
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
});

export const getEventiInEvidenza = cache(
  async (): Promise<EventoView[]> => {
    const eventi = await getEventi();
    return eventi.filter((e) => e.inEvidenza);
  },
);

/** Evento singolo + corpo MDX risolto (stringa raw). */
export const getEventoBySlug = cache(
  async (slug: string): Promise<EventoView | null> => {
    const entry = await reader.collections.eventi.read(slug, {
      resolveLinkedFiles: true,
    });
    if (!entry) return null;
    const base = toEvento(slug, entry as unknown as Record<string, unknown>);
    return enrich(base);
  },
);

export const getEventiSlugs = cache(async (): Promise<string[]> => {
  const entries = await reader.collections.eventi.all();
  return entries.map((e) => e.slug);
});
