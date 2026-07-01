import type { Evento } from "@/lib/content/types";

/**
 * Le date evento sono "wall-clock" di Roma (Keystatic, senza fuso). Per evitare
 * bug di conversione/DST, emettiamo orari "floating" (senza Z): i calendari li
 * interpretano nell'orario locale dell'utente — corretto per un pubblico romano.
 */

/** "2026-05-31T20:00" → "20260531T200000" (floating, niente Z). */
function toIcsFloating(value: string): string {
  const [date, time = "00:00"] = value.split("T");
  const [y, mo, d] = date.split("-");
  const [h, mi] = time.split(":");
  return `${y}${mo}${d}T${h}${mi}00`;
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function nowStampUtc(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function endValue(evento: Evento): string {
  if (evento.dataFine) return evento.dataFine;
  // default +2h se manca la fine
  const [date, time = "00:00"] = evento.dataInizio.split("T");
  const [h, mi] = time.split(":").map(Number);
  const end = String(h + 2).padStart(2, "0");
  return `${date}T${end}:${String(mi).padStart(2, "0")}`;
}

function luogoString(evento: Evento): string {
  return [evento.luogo.nome, evento.luogo.indirizzo, evento.luogo.citta]
    .filter(Boolean)
    .join(", ");
}

/** Contenuto di un file .ics per un evento (RFC 5545, orari floating). */
export function buildIcs(evento: Evento, siteUrl: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Comunita Islamica di Roma//IT",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${evento.slug}@comunitaislamicadiroma.it`,
    `DTSTAMP:${nowStampUtc()}`,
    `DTSTART:${toIcsFloating(evento.dataInizio)}`,
    `DTEND:${toIcsFloating(endValue(evento))}`,
    `SUMMARY:${escapeIcs(evento.titolo)}`,
    `DESCRIPTION:${escapeIcs(evento.estratto)}`,
    `LOCATION:${escapeIcs(luogoString(evento))}`,
    `URL:${siteUrl}/eventi/${evento.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

/** Link "Aggiungi a Google Calendar" (fuso esplicito Europe/Rome). */
export function googleCalendarUrl(evento: Evento): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: evento.titolo,
    dates: `${toIcsFloating(evento.dataInizio)}/${toIcsFloating(endValue(evento))}`,
    details: evento.estratto,
    location: luogoString(evento),
    ctz: "Europe/Rome",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
