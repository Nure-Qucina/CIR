import "server-only";
import { cache } from "react";
import { reader } from "./reader";
import { routing, type Locale } from "@/i18n/routing";
import type {
  AreaProfessionisti,
  CodiceLingua,
  GruppoSponsor,
  ServizioMoschea,
  Zona,
} from "./rete-opzioni";

/**
 * Layer dati della sezione «La rete» (Moschee, Sponsor, Professionisti).
 * Stesse regole di eventi/articoli: le bozze non escono mai da qui, i campi
 * testuali hanno l'italiano nei campi principali e le altre lingue in
 * `traduzioni.<locale>` (campo per campo: se manca si ricade sull'italiano).
 */

type Raw = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const opt = (v: unknown): string | undefined => str(v) || undefined;
const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** Campo tradotto: la traduzione se presente, altrimenti l'italiano. */
function tradotto(entry: Raw, campo: string, it: unknown, locale: Locale) {
  if (locale === routing.defaultLocale)
    return { valore: str(it), fallback: false };
  const t = ((entry.traduzioni ?? {}) as Record<string, Raw | undefined>)[
    locale
  ];
  const v = str(t?.[campo]);
  return v
    ? { valore: v, fallback: false }
    : { valore: str(it), fallback: Boolean(str(it)) };
}

// ─── Moschee ────────────────────────────────────────────────────────────

export type Moschea = {
  slug: string;
  nome: string;
  associazione?: string;
  zona: Zona;
  municipio: string;
  quartiere?: string;
  /** Solo se la moschea ha dato il permesso (mostraIndirizzo). */
  indirizzo?: string;
  /** Coordinate per la mappa: solo se l'indirizzo è pubblico. */
  posizione?: { lat: number; lng: number };
  venerdi?: string;
  servizi: ServizioMoschea[];
  lingueKhutba: CodiceLingua[];
  foto?: string;
  contatti: { telefono?: string; email?: string; sito?: string };
};

function toMoschea(slug: string, e: Raw): Moschea {
  const pubblico = Boolean(e.mostraIndirizzo);
  const lat = num(e.lat);
  const lng = num(e.lng);
  const c = (e.contatti ?? {}) as Raw;
  return {
    slug,
    nome: str(e.nome),
    associazione: opt(e.associazione),
    zona: (str(e.zona) || "est") as Zona,
    // Fuori Roma il municipio non esiste: il campo in Keystatic è obbligatorio,
    // quindi qui lo si ignora e si mostra solo il quartiere/comune.
    municipio: e.zona === "fuori" ? "" : str(e.municipio),
    quartiere: opt(e.quartiere),
    indirizzo: pubblico ? opt(e.indirizzo) : undefined,
    posizione:
      pubblico && lat !== undefined && lng !== undefined
        ? { lat, lng }
        : undefined,
    venerdi: opt(e.venerdi),
    servizi: (Array.isArray(e.servizi) ? e.servizi : []) as ServizioMoschea[],
    lingueKhutba: (Array.isArray(e.lingueKhutba)
      ? e.lingueKhutba
      : []) as CodiceLingua[],
    foto: opt(e.foto),
    contatti: {
      telefono: opt(c.telefono),
      email: opt(c.email),
      sito: opt(c.sito),
    },
  };
}

export const getMoschee = cache(async (): Promise<Moschea[]> => {
  const entries = await reader.collections.moschee.all();
  return entries
    .filter((e) => !(e.entry as Raw).bozza)
    .map((e) => toMoschea(e.slug, e.entry as Raw))
    .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
});

// ─── Sponsor ────────────────────────────────────────────────────────────

export type Sponsor = {
  slug: string;
  nome: string;
  gruppo: GruppoSponsor;
  tipo: string;
  quartiere?: string;
  indirizzo?: string;
  logo?: string;
  foto: string[];
  fiducia: string;
  descrizione?: string;
  orari?: string;
  vantaggio?: string;
  contatti: {
    telefono?: string;
    sito?: string;
    instagram?: string;
    facebook?: string;
  };
  ordine?: number;
  /** true se almeno un testo mostrato è il fallback italiano. */
  isFallback: boolean;
};

function toSponsor(slug: string, e: Raw, locale: Locale): Sponsor {
  const tipo = tradotto(e, "tipo", e.tipo, locale);
  const fiducia = tradotto(e, "fiducia", e.fiducia, locale);
  const descrizione = tradotto(e, "descrizione", e.descrizione, locale);
  const orari = tradotto(e, "orari", e.orari, locale);
  const vantaggio = tradotto(e, "vantaggio", e.vantaggio, locale);
  const c = (e.contatti ?? {}) as Raw;
  return {
    slug,
    nome: str(e.nome),
    gruppo: (str(e.gruppo) || "servizi") as GruppoSponsor,
    tipo: tipo.valore,
    quartiere: opt(e.quartiere),
    indirizzo: opt(e.indirizzo),
    logo: opt(e.logo),
    foto: (Array.isArray(e.foto) ? e.foto : []).map(str).filter(Boolean),
    fiducia: fiducia.valore,
    descrizione: descrizione.valore || undefined,
    orari: orari.valore || undefined,
    vantaggio: vantaggio.valore || undefined,
    contatti: {
      telefono: opt(c.telefono),
      sito: opt(c.sito),
      instagram: opt(c.instagram),
      facebook: opt(c.facebook),
    },
    ordine: num(e.ordine),
    isFallback: [tipo, fiducia, descrizione].some((x) => x.fallback),
  };
}

function ordinaSponsor(a: Sponsor, b: Sponsor): number {
  const oa = a.ordine ?? Number.POSITIVE_INFINITY;
  const ob = b.ordine ?? Number.POSITIVE_INFINITY;
  return oa !== ob ? oa - ob : a.nome.localeCompare(b.nome, "it");
}

export const getSponsor = cache(
  async (locale: Locale = routing.defaultLocale): Promise<Sponsor[]> => {
    const entries = await reader.collections.sponsor.all();
    return entries
      .filter((e) => !(e.entry as Raw).bozza)
      .map((e) => toSponsor(e.slug, e.entry as Raw, locale))
      .sort(ordinaSponsor);
  },
);

export const getSponsorBySlug = cache(
  async (
    slug: string,
    locale: Locale = routing.defaultLocale,
  ): Promise<Sponsor | null> => {
    const entry = (await reader.collections.sponsor.read(slug)) as Raw | null;
    if (!entry || entry.bozza) return null;
    return toSponsor(slug, entry, locale);
  },
);

/** Lingue in cui la scheda è davvero tradotta (IT sempre), per gli hreflang. */
export const lingueSponsor = cache(async (slug: string): Promise<Locale[]> => {
  const out: Locale[] = [];
  for (const l of routing.locales) {
    const s = await getSponsorBySlug(slug, l);
    if (s && (l === routing.defaultLocale || !s.isFallback)) out.push(l);
  }
  return out.length ? out : [routing.defaultLocale];
});

export const getSponsorSlugs = cache(async (): Promise<string[]> => {
  const entries = await reader.collections.sponsor.all();
  return entries.filter((e) => !(e.entry as Raw).bozza).map((e) => e.slug);
});

// ─── Professionisti ─────────────────────────────────────────────────────

export type Professionista = {
  slug: string;
  nome: string;
  area: AreaProfessionisti;
  tipo: "persona" | "azienda";
  immagine?: string;
  ruolo: string;
  /** Ambiti di lavoro (uno per riga in Keystatic), mostrati come etichette. */
  ambiti: string[];
  zona?: string;
  inStudio: boolean;
  online: boolean;
  albo?: string;
  lingue: CodiceLingua[];
  perche: string;
  descrizione?: string;
  /** Assente se scaduta (validaFino nel passato) o non compilata. */
  agevolazione?: {
    breve: string;
    suCosa: string;
    passi: string[];
    validaFino?: string;
  };
  contatti: {
    telefono?: string;
    whatsapp?: string;
    email?: string;
    sito?: string;
    indirizzo?: string;
  };
  isFallback: boolean;
};

/** Oggi in formato YYYY-MM-DD (fuso di Roma), per confrontare validaFino. */
function oggiRoma(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome" }).format(
    new Date(),
  );
}

function toProfessionista(
  slug: string,
  e: Raw,
  locale: Locale,
): Professionista {
  const ruolo = tradotto(e, "ruolo", e.ruolo, locale);
  const ambiti = tradotto(e, "ambiti", e.ambiti, locale);
  const perche = tradotto(e, "perche", e.perche, locale);
  const descrizione = tradotto(e, "descrizione", e.descrizione, locale);
  const a = (e.agevolazione ?? {}) as Raw;
  const suCosa = tradotto(e, "suCosa", a.suCosa, locale);
  const come = tradotto(e, "come", a.come, locale);
  const validaFino = opt(a.validaFino);
  const scaduta = validaFino !== undefined && validaFino < oggiRoma();
  const breve = str(a.breve);
  const c = (e.contatti ?? {}) as Raw;
  return {
    slug,
    nome: str(e.nome),
    area: (str(e.area) || "legale") as AreaProfessionisti,
    tipo: e.tipo === "azienda" ? "azienda" : "persona",
    immagine: opt(e.immagine),
    ruolo: ruolo.valore,
    ambiti: ambiti.valore
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    zona: opt(e.zona),
    inStudio: Boolean(e.inStudio),
    online: Boolean(e.online),
    albo: opt(e.albo),
    lingue: (Array.isArray(e.lingue) ? e.lingue : []) as CodiceLingua[],
    perche: perche.valore,
    descrizione: descrizione.valore || undefined,
    agevolazione:
      breve && !scaduta
        ? {
            breve,
            suCosa: suCosa.valore,
            passi: come.valore
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            validaFino,
          }
        : undefined,
    contatti: {
      telefono: opt(c.telefono),
      whatsapp: opt(c.whatsapp),
      email: opt(c.email),
      sito: opt(c.sito),
      indirizzo: opt(c.indirizzo),
    },
    isFallback: [ruolo, perche, descrizione].some((x) => x.fallback),
  };
}

export const getProfessionisti = cache(
  async (locale: Locale = routing.defaultLocale): Promise<Professionista[]> => {
    const entries = await reader.collections.professionisti.all();
    return entries
      .filter((e) => !(e.entry as Raw).bozza)
      .map((e) => toProfessionista(e.slug, e.entry as Raw, locale))
      .sort((a, b) => a.nome.localeCompare(b.nome, "it"));
  },
);

export const getProfessionistaBySlug = cache(
  async (
    slug: string,
    locale: Locale = routing.defaultLocale,
  ): Promise<Professionista | null> => {
    const entry = (await reader.collections.professionisti.read(
      slug,
    )) as Raw | null;
    if (!entry || entry.bozza) return null;
    return toProfessionista(slug, entry, locale);
  },
);

/** Lingue in cui la scheda è davvero tradotta (IT sempre), per gli hreflang. */
export const lingueProfessionista = cache(
  async (slug: string): Promise<Locale[]> => {
    const out: Locale[] = [];
    for (const l of routing.locales) {
      const p = await getProfessionistaBySlug(slug, l);
      if (p && (l === routing.defaultLocale || !p.isFallback)) out.push(l);
    }
    return out.length ? out : [routing.defaultLocale];
  },
);

export const getProfessionistiSlugs = cache(async (): Promise<string[]> => {
  const entries = await reader.collections.professionisti.all();
  return entries.filter((e) => !(e.entry as Raw).bozza).map((e) => e.slug);
});

// Link per Indicazioni/Chiama/WhatsApp: vivono in rete-link.ts (usabili anche lato client).
export { mapsUrl, telHref, whatsappHref } from "./rete-link";
