/**
 * Dato neutro + tipi del contenuto istituzionale (§8 del brief). Il testo
 * vero (mission, valori, storia, media, intro chi-siamo) vive in
 * `messages/it.json` sotto il namespace "istituzionale" — è contenuto
 * traducibile ma non gestito dai redattori quotidianamente (a differenza di
 * eventi/articoli, non ha un flusso in Keystatic).
 */

export const DATO_ASSOCIAZIONI = 25;

export type Valore = {
  titolo: string;
  testo: string;
  /** Versione corta per i foglietti della home. */
  breve?: string;
  icona: "heart" | "users" | "hand-helping" | "messages-square";
};

export type MomentoStoria = {
  periodo: string;
  testo: string;
};
