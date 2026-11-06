/**
 * Cassetta delle segnalazioni CSP (/api/csp-report).
 *
 * Quando la Content Security Policy blocca (o, su /keystatic, segnalerebbe)
 * una risorsa, il browser del visitatore invia qui una segnalazione. Si
 * registra una riga nei log Vercel ("[csp] …") con il minimo indispensabile:
 * regola, origine bloccata, pagina (solo il percorso) e se è un blocco vero
 * o solo un'osservazione. Niente IP, niente user agent, niente query string.
 *
 * Accetta i due formati dei browser:
 *  - report-uri  (Firefox/Safari): {"csp-report": {...}}, kebab-case
 *  - report-to   (Chrome/Edge):    [{type:"csp-violation", body:{...}}], camelCase
 */

export const CSP_REPORT_MAX_BYTES = 16 * 1024;
export const CSP_REPORT_MAX_ITEMS = 10;

export type CspSegnalazione = {
  regola: string;
  bloccato: string;
  pagina: string;
  tipo: "blocco" | "osservazione";
};

type Record_ = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Solo il percorso della pagina, senza dominio, query o frammento. */
function soloPercorso(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "";
    return u.pathname.slice(0, 200) || "/";
  } catch {
    return "";
  }
}

/**
 * Cosa è stato bloccato, ridotto all'origine (https://host) oppure a parole
 * chiave come "inline", "eval", "data", "blob".
 */
function soloOrigine(blocked: string): string {
  if (!blocked) return "";
  if (/^[a-z-]{1,30}$/i.test(blocked)) return blocked.toLowerCase(); // inline, eval, self…
  try {
    const u = new URL(blocked);
    if (u.protocol === "http:" || u.protocol === "https:" || u.protocol === "wss:" || u.protocol === "ws:") {
      return u.origin.slice(0, 100);
    }
    return u.protocol.replace(/:$/, "").slice(0, 30); // data, blob, chrome-extension…
  } catch {
    // Mai il valore grezzo: potrebbe contenere a-capo o dati.
    return "non-valido";
  }
}

/** Segnalazioni causate da estensioni del browser: rumore, non problemi del sito. */
const ESTENSIONI = /^(chrome-extension|moz-extension|safari-extension|safari-web-extension|ms-browser-extension)$/;

function normalizza(raw: Record_, formato: "uri" | "to"): CspSegnalazione | null {
  const k = (kebab: string, camel: string) =>
    str(formato === "uri" ? raw[kebab] : raw[camel]);

  const regola = (k("effective-directive", "effectiveDirective") || k("violated-directive", "violatedDirective"))
    .trim()
    .split(/\s/)[0]
    .toLowerCase();
  const bloccato = soloOrigine(k("blocked-uri", "blockedURL"));
  const pagina = soloPercorso(k("document-uri", "documentURL"));
  const sorgente = soloOrigine(k("source-file", "sourceFile"));
  const disposizione = k("disposition", "disposition");

  // Le regole CSP sono parole come "script-src-elem": tutto il resto è falso.
  if (!/^[a-z-]{1,40}$/.test(regola)) return null;
  if (ESTENSIONI.test(bloccato) || ESTENSIONI.test(sorgente)) return null;

  return {
    regola,
    bloccato,
    pagina,
    tipo: disposizione === "report" ? "osservazione" : "blocco",
  };
}

/**
 * Riga di log: solo caratteri ASCII stampabili, così nessuno può spezzarla
 * in più righe false o inserire codici di controllo.
 */
export function rigaLog(s: CspSegnalazione): string {
  const riga = `[csp] ${s.tipo} ${s.regola} ${s.bloccato || "-"} su ${s.pagina || "-"}`;
  return riga.replace(/[^\x20-\x7e]/g, "?").slice(0, 300);
}

/** Estrae le segnalazioni dal corpo inviato dal browser. Mai eccezioni. */
export function leggiSegnalazioni(testo: string): CspSegnalazione[] {
  if (!testo || testo.length > CSP_REPORT_MAX_BYTES) return [];
  let dati: unknown;
  try {
    dati = JSON.parse(testo);
  } catch {
    return [];
  }

  const grezzi: Array<{ raw: Record_; formato: "uri" | "to" }> = [];
  if (Array.isArray(dati)) {
    for (const voce of dati) {
      if (voce && typeof voce === "object") {
        const v = voce as Record_;
        if (v.type === "csp-violation" && v.body && typeof v.body === "object") {
          grezzi.push({ raw: v.body as Record_, formato: "to" });
        }
      }
    }
  } else if (dati && typeof dati === "object") {
    const r = (dati as Record_)["csp-report"];
    if (r && typeof r === "object") grezzi.push({ raw: r as Record_, formato: "uri" });
  }

  const out: CspSegnalazione[] = [];
  for (const g of grezzi.slice(0, CSP_REPORT_MAX_ITEMS)) {
    const s = normalizza(g.raw, g.formato);
    if (s) out.push(s);
  }
  return out;
}
