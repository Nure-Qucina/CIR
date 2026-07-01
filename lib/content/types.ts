/**
 * Tipi del modello dati CIR (§3 del brief).
 * Sono la "fonte di verità" dei contenuti: pagine e componenti dipendono da
 * questi tipi, non dalla forma fisica dei file. Cambiare CMS non rompe le pagine.
 */

export type CategoriaColore = "teal" | "orange";

export type Categoria = {
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

export type Evento = {
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

export type Articolo = {
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

export type NavItem = { label: string; href: string };

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
  payoff: string;
  descrizione: string;
  /** Etichetta configurabile per la sezione news (News/Articoli/Approfondimenti). */
  labelNews: string;
  social: SocialLink[];
  donazioniUrl: string;
  contatti: Contatti;
  nav: NavItem[];
  navLegale: NavItem[];
};
