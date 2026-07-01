import "server-only";
import { cache } from "react";
import { reader } from "./reader";
import type { Categoria, CategoriaColore } from "./types";

/** Tutte le categorie, ordinate per nome. */
export const getCategorie = cache(async (): Promise<Categoria[]> => {
  const entries = await reader.collections.categorie.all();
  return entries
    .map((e) => ({
      slug: e.slug,
      nome: e.entry.nome,
      descrizione: e.entry.descrizione,
      colore: e.entry.colore as CategoriaColore,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
});

export const getCategoriaBySlug = cache(
  async (slug: string): Promise<Categoria | null> => {
    const entry = await reader.collections.categorie.read(slug);
    if (!entry) return null;
    return {
      slug,
      nome: entry.nome,
      descrizione: entry.descrizione,
      colore: entry.colore as CategoriaColore,
    };
  },
);

/** Mappa slug → categoria, comoda per arricchire eventi/articoli. */
export const getCategorieMap = cache(
  async (): Promise<Map<string, Categoria>> => {
    const cats = await getCategorie();
    return new Map(cats.map((c) => [c.slug, c]));
  },
);
