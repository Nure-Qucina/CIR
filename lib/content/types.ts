/**
 * Tipi del modello dati CIR (§3 del brief).
 * Sono la "fonte di verità" dei contenuti: pagine e componenti dipendono da
 * questi tipi, non dalla forma fisica dei file. Cambiare CMS non rompe le pagine.
 */

import type { Locale } from "@/i18n/routing";

export type CategoriaColore = "teal" | "orange";

/**
 * Flag di localizzazione (§5-6 del brief i18n): un contenuto risolto per una
 * lingua può essere una traduzione reale o un fallback all'italiano quando
 * la traduzione manca. Le pagine mostrano il badge "Disponibile in italiano"
 * quando `isFallback` è true.
 */
export type Localizzato = {
  isFallback: boolean;
  originalLocale: Locale;
};

export type Categoria = Localizzato & {
  slug: string;
  nome: string;
  descrizione: string;
  colore: CategoriaColore;
};

export type Luogo = {
  nome: string;
  indirizzo: string;
  citta: string;
  lat?: number;
  lng?: number;
};

export type Seo = {
  title?: string;
  description?: string;
  ogImage?: string;
};

export type EventoStato = "programmato" | "passato";

export type Evento = Localizzato & {
  slug: string;
  titolo: string;
  stato: EventoStato;
  dataInizio: string; // ISO
  dataFine?: string; // ISO
  tuttoIlGiorno: boolean;
  luogo: Luogo;
  estratto: string;
  descrizione?: string; // MDX/rich text
  copertina?: string;
  categoria?: string;
  ctaEsterna?: { label: string; url: string };
  inEvidenza: boolean;
  seo?: Seo;
};

export type TipoArticolo = "articolo" | "comunicato";

export type Articolo = Localizzato & {
  slug: string;
  titolo: string;
  estratto: string;
  categoria: string; // slug categoria
  tags: string[];
  autore: string;
  dataPubblicazione: string; // ISO date
  dataModifica?: string | null;
  copertina?: string;
  tempoLettura?: number; // minuti (calcolato se assente)
  inEvidenza: boolean;
  tipo: TipoArticolo;
  seo?: Seo;
  /** Corpo MDX (stringa raw) — opzionale finché non migrato. */
  corpo?: string;
};

export type SocialLink = {
  piattaforma: "facebook" | "instagram";
  url: string;
};

export type Contatti = {
  email: string | null;
  telefono: string | null;
  indirizzo: string | null;
  /** true se il dato è ancora un placeholder DA FORNIRE dal cliente. */
  placeholder: boolean;
};

export type SiteConfig = {
  nome: string;
  sigla: string;
  /** Codice fiscale dell'associazione (footer + informativa privacy). */
  codiceFiscale: string | null;
  payoff: string;
  descrizione: string;
  /** Etichetta configurabile per la sezione news (News/Articoli/Approfondimenti). */
  labelNews: string;
  social: SocialLink[];
  donazioniUrl: string;
  contatti: Contatti;
};
