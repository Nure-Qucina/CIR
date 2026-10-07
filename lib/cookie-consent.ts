/**
 * Gestione del consenso cookie (GDPR, art. 122 Codice privacy, linee guida
 * cookie del Garante del 10/6/2021).
 *
 * Il consenso è registrato in un cookie first-party (tecnico/necessario, non
 * richiede a sua volta consenso). È versionato: se `CONSENT_VERSION` cambia
 * — cioè se cambiano gli strumenti o le categorie — il consenso precedente
 * non è più valido e il banner ricompare.
 *
 * Unica categoria facoltativa: "statistiche" (Vercel Web Analytics + Speed
 * Insights, vedi components/legal/ConsentedAnalytics.tsx). Il sito non usa
 * strumenti di marketing o profilazione: se un giorno se ne aggiunge uno,
 * servono una nuova categoria, un nuovo `CONSENT_VERSION` e l'aggiornamento
 * dell'informativa (app/[locale]/(site)/privacy).
 *
 * Gli strumenti facoltativi vanno caricati solo se `hasConsentFor(...)` è
 * vero, ascoltando `CONSENT_CHANGE_EVENT` per reagire a un cambio di scelta.
 */

export const CONSENT_COOKIE = "cir-cookie-consent";
/**
 * v2 (ottobre 2026): tolta la categoria "marketing" (nessuno strumento
 * dietro) e le statistiche Vercel ora partono davvero solo col consenso.
 * I consensi v1 non valgono più: il banner viene richiesto di nuovo.
 */
export const CONSENT_VERSION = 2;
/** Durata della scelta: 6 mesi, come indicano le linee guida del Garante. */
export const CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 180;

/** Riaprire il pannello preferenze da qualunque punto del sito. */
export const OPEN_SETTINGS_EVENT = "open-cookie-settings";
/** Emesso a ogni salvataggio del consenso (detail: ConsentRecord). */
export const CONSENT_CHANGE_EVENT = "cir-cookie-consent-change";

export type ConsentCategory = "statistiche";

export type ConsentRecord = {
  v: number;
  /** I necessari sono sempre attivi: non richiedono consenso. */
  necessari: true;
  statistiche: boolean;
  /** Timestamp (ms) del consenso — utile per dimostrarne la data. */
  ts: number;
};

/** Legge il consenso valido, o `null` se assente/scaduto/di versione diversa. */
export function readConsent(): ConsentRecord | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE}=([^;]*)`),
  );
  if (!match) return null;
  try {
    const rec = JSON.parse(decodeURIComponent(match[1])) as ConsentRecord;
    if (rec.v !== CONSENT_VERSION) return null;
    return rec;
  } catch {
    return null;
  }
}

/**
 * Salva il consenso nel cookie (6 mesi), poi emette CONSENT_CHANGE_EVENT.
 * `necessari` è forzato a true. Restituisce il record salvato.
 */
export function writeConsent(prefs: { statistiche: boolean }): ConsentRecord {
  const record: ConsentRecord = {
    v: CONSENT_VERSION,
    necessari: true,
    statistiche: prefs.statistiche,
    ts: Date.now(),
  };

  if (typeof document !== "undefined") {
    const value = encodeURIComponent(JSON.stringify(record));
    const secure =
      typeof location !== "undefined" && location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE_SEC}; SameSite=Lax${secure}`;
    window.dispatchEvent(
      new CustomEvent(CONSENT_CHANGE_EVENT, { detail: record }),
    );
  }

  return record;
}

/** True se l'utente ha dato il consenso per la categoria indicata. */
export function hasConsentFor(category: ConsentCategory): boolean {
  const consent = readConsent();
  return consent?.[category] === true;
}
