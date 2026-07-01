/**
 * Formattazione date in italiano.
 *
 * Keystatic salva date e datetime come "wall-clock" senza fuso
 * ("2026-05-31T12:00", "2025-08-25"). Per mostrare ESATTAMENTE ciò che il
 * redattore inserisce — a prescindere dal fuso del server (Vercel = UTC) —
 * interpretiamo i componenti come UTC e formattiamo in UTC. Così non c'è
 * conversione di fuso che sposti l'orario.
 */

type Parts = {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  hasTime: boolean;
};

function parseNaive(value: string): Parts {
  const [datePart, timePart] = value.split("T");
  const [y, mo, d] = datePart.split("-").map(Number);
  let h = 0;
  let mi = 0;
  const hasTime = Boolean(timePart);
  if (hasTime) {
    const [hh, mm] = timePart.split(":").map(Number);
    h = hh ?? 0;
    mi = mm ?? 0;
  }
  return { y, mo, d, h, mi, hasTime };
}

function toUtcDate(p: Parts): Date {
  return new Date(Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi));
}

export function formatDateIt(value: string): string {
  const d = toUtcDate(parseNaive(value));
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function formatTimeIt(value: string): string {
  const p = parseNaive(value);
  return `${String(p.h).padStart(2, "0")}:${String(p.mi).padStart(2, "0")}`;
}

export function formatDateTimeIt(value: string): string {
  const p = parseNaive(value);
  const data = formatDateIt(value);
  return p.hasTime ? `${data}, ${formatTimeIt(value)}` : data;
}

/** Etichetta mese/anno (es. "Maggio 2026") per gli header sticky della timeline. */
export function formatMonthYearIt(value: string): string {
  const d = toUtcDate(parseNaive(value));
  const s = new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Chiave ordinabile mese/anno (YYYY-MM) per raggruppare. */
export function monthKey(value: string): string {
  const p = parseNaive(value);
  return `${p.y}-${String(p.mo).padStart(2, "0")}`;
}

/** ISO date (YYYY-MM-DD) per <time datetime> e JSON-LD. */
export function isoDate(value: string): string {
  const p = parseNaive(value);
  return `${p.y}-${String(p.mo).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}
