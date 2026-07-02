/**
 * Gestione del consenso cookie (GDPR).
 *
 * Il consenso è registrato in un cookie first-party (tecnico/necessario, non
 * richiede a sua volta consenso). È versionato: se `CONSENT_VERSION` cambia
 * — cioè se cambia la policy o le categorie — il consenso precedente non è
 * più valido e il banner ricompare.
 *
 * Nessuno script di statistica/marketing è oggi presente nel sito. Quando ne
 * verrà aggiunto uno, va condizionato al consenso: leggi `hasConsentFor(...)`
 * al caricamento e/o ascolta l'evento `CONSENT_CHANGE_EVENT` per reagire in
 * tempo reale a un cambio di preferenze.
 */

export const CONSENT_COOKIE = "cir-cookie-consent";
export const CONSENT_VERSION = 1;

/** Riaprire il pannello preferenze da qualunque punto del sito. */
export const OPEN_SETTINGS_EVENT = "open-cookie-settings";
/** Emesso a ogni salvataggio del consenso (detail: ConsentRecord). */
export const CONSENT_CHANGE_EVENT = "cir-cookie-consent-change";

export type ConsentCategory = "statistiche" | "marketing";

export type ConsentRecord = {
  v: number;
  /** I necessari sono sempre attivi: non richiedono consenso. */
  necessari: true;
  statistiche: boolean;
  marketing: boolean;
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
 * Salva il consenso nel cookie (180 giorni), poi emette CONSENT_CHANGE_EVENT.
 * `necessari` è forzato a true. Restituisce il record salvato.
 */
export function writeConsent(prefs: {
  statistiche: boolean;
  marketing: boolean;
}): ConsentRecord {
  const record: ConsentRecord = {
    v: CONSENT_VERSION,
    necessari: true,
    statistiche: prefs.statistiche,
    marketing: prefs.marketing,
    ts: Date.now(),
  };

  if (typeof document !== "undefined") {
    const value = encodeURIComponent(JSON.stringify(record));
    const maxAge = 60 * 60 * 24 * 180; // 180 giorni
    const secure =
      typeof location !== "undefined" && location.protocol === "https:"
        ? "; Secure"
        : "";
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
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
