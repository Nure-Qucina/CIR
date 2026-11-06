/**
 * Regole del form contatti (audit 6/11/2026, P1.2): limiti di lunghezza,
 * pulizia del nome usato nell'oggetto, mittente su dominio verificato,
 * parametri anti-abuso. Funzioni pure, testate in guard.test.ts.
 */

export const CONTACT_LIMITS = {
  nomeMin: 2,
  nomeMax: 80,
  emailMax: 254,
  messaggioMin: 10,
  messaggioMax: 5000,
} as const;

/** Massimo 3 messaggi ogni 20 minuti dalla stessa connessione (IP). */
export const CONTACT_RATE_LIMIT = { max: 3, window: "20 m" } as const;

/** Azione Turnstile del form contatti, distinta da quella delle donazioni. */
export const CONTACT_TURNSTILE_ACTION = "contact_form";

/** Nome campo del token Turnstile nel FormData. */
export const CONTACT_TURNSTILE_FIELD = "turnstileToken";

const CONTACT_DISPLAY_NAME = "Sito CIR";
const DEV_FROM_ADDRESS = "onboarding@resend.dev";

/**
 * Il nome finisce nell'oggetto dell'email: via a-capo, tab e altri caratteri
 * di controllo (niente righe nascoste) e segni di direzione del testo (niente
 * oggetti che si leggono al contrario), spazi multipli ridotti a uno.
 */
export function pulisciNome(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F\u2028\u2029]+/g, " ")
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isEmail(value: string): boolean {
  return (
    value.length <= CONTACT_LIMITS.emailMax &&
    /^[^\s@<>,;"()\[\]\\\u0000-\u001F\u007F]+@[^\s@<>,;"()\[\]\\\u0000-\u001F\u007F]+\.[^\s@<>,;"()\[\]\\\u0000-\u001F\u007F]+$/.test(value)
  );
}

export type ContactFieldError =
  | "erroreNome"
  | "erroreNomeLungo"
  | "erroreEmail"
  | "erroreMessaggio"
  | "erroreMessaggioLungo";

export function validaContatto(input: {
  nome: string;
  email: string;
  messaggio: string;
}): Partial<Record<"nome" | "email" | "messaggio", ContactFieldError>> {
  const errors: Partial<Record<"nome" | "email" | "messaggio", ContactFieldError>> =
    {};
  if (input.nome.length < CONTACT_LIMITS.nomeMin) errors.nome = "erroreNome";
  else if (input.nome.length > CONTACT_LIMITS.nomeMax)
    errors.nome = "erroreNomeLungo";
  if (!isEmail(input.email)) errors.email = "erroreEmail";
  if (input.messaggio.length < CONTACT_LIMITS.messaggioMin)
    errors.messaggio = "erroreMessaggio";
  else if (input.messaggio.length > CONTACT_LIMITS.messaggioMax)
    errors.messaggio = "erroreMessaggioLungo";
  return errors;
}

function estraiIndirizzo(raw: string | undefined): string | null {
  const value = raw?.trim() ?? "";
  if (!value) return null;
  const angled = value.match(/<([^<>\s]+@[^<>\s]+)>\s*$/);
  const email = angled ? angled[1] : value;
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : null;
}

/**
 * Mittente del form: CONTACT_FORM_FROM se impostato, altrimenti lo stesso
 * indirizzo delle email di donazione (DONATION_EMAIL_FROM, dominio CIR già
 * verificato su Resend). Il nome mostrato è sempre «Sito CIR».
 * Fuori produzione, senza configurazione, usa il mittente di prova di Resend;
 * in produzione restituisce null (il form non invia con un mittente di prova).
 */
export function contactFromAddress(
  env: {
    CONTACT_FORM_FROM?: string;
    DONATION_EMAIL_FROM?: string;
  },
  production: boolean,
): string | null {
  const email =
    estraiIndirizzo(env.CONTACT_FORM_FROM) ??
    estraiIndirizzo(env.DONATION_EMAIL_FROM);
  if (email) return `${CONTACT_DISPLAY_NAME} <${email}>`;
  return production ? null : `${CONTACT_DISPLAY_NAME} <${DEV_FROM_ADDRESS}>`;
}
