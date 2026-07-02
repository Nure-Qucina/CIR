import "server-only";
import { cache } from "react";
import { reader } from "./reader";
import type { Categoria, CategoriaColore } from "./types";
import { routing, type Locale } from "@/i18n/routing";

type CategorieEntry = Awaited<
  ReturnType<typeof reader.collections.categorie.read>
>;

/**
 * Risolve i campi localizzati (nome/descrizione) per la lingua richiesta.
 * L'italiano vive nei campi principali (nome/descrizione), invariati; le
 * altre lingue in `traduzioni.<locale>` sono opzionali — se assenti si
 * ricade sull'italiano e si segnala `isFallback` (§5-6 brief i18n).
 */
function resolveCategoria(
  slug: string,
  entry: NonNullable<CategorieEntry>,
  locale: Locale,
): Categoria {
  const colore = entry.colore as CategoriaColore;
  if (locale === routing.defaultLocale) {
    return {
      slug,
      nome: entry.nome,
      descrizione: entry.descrizione,
      colore,
      isFallback: false,
      originalLocale: routing.defaultLocale,
    };
  }

  const traduzioni = entry.traduzioni as Record<
    string,
    { nome: string; descrizione: string } | undefined
  >;
  const t = traduzioni?.[locale];
  const tradotto = Boolean(t?.nome?.trim());
  return {
    slug,
    nome: tradotto ? t!.nome : entry.nome,
    descrizione: tradotto && t?.descrizione ? t.descrizione : entry.descrizione,
    colore,
    isFallback: !tradotto,
    originalLocale: tradotto ? locale : routing.defaultLocale,
  };
}

/** Tutte le categorie, ordinate per nome (nella lingua richiesta). */
export const getCategorie = cache(
  async (locale: Locale = routing.defaultLocale): Promise<Categoria[]> => {
    const entries = await reader.collections.categorie.all();
    return entries
      .map((e) => resolveCategoria(e.slug, e.entry, locale))
      .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  },
);

export const getCategoriaBySlug = cache(
  async (
    slug: string,
    locale: Locale = routing.defaultLocale,
  ): Promise<Categoria | null> => {
    const entry = await reader.collections.categorie.read(slug);
    if (!entry) return null;
    return resolveCategoria(slug, entry, locale);
  },
);

/** Mappa slug → categoria, comoda per arricchire eventi/articoli. */
export const getCategorieMap = cache(
  async (
    locale: Locale = routing.defaultLocale,
  ): Promise<Map<string, Categoria>> => {
    const cats = await getCategorie(locale);
    return new Map(cats.map((c) => [c.slug, c]));
  },
);

/** Lingue in cui la categoria è realmente tradotta (IT sempre incluso) — per hreflang (§9 brief i18n). */
export const getCategoriaAvailableLocales = cache(
  async (slug: string): Promise<Locale[]> => {
    const entry = await reader.collections.categorie.read(slug);
    if (!entry) return [routing.defaultLocale];
    const traduzioni = entry.traduzioni as Record<
      string,
      { nome: string } | undefined
    >;
    return routing.locales.filter(
      (loc) =>
        loc === routing.defaultLocale ||
        Boolean(traduzioni?.[loc]?.nome?.trim()),
    );
  },
);
