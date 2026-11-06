/** Link condivisi della sezione «La rete» (server e client). */

/** Link «Indicazioni» su Google Maps (coordinate se ci sono, se no indirizzo). */
export function mapsUrl(q: {
  posizione?: { lat: number; lng: number };
  indirizzo?: string;
  nome?: string;
}) {
  if (q.posizione) {
    return `https://www.google.com/maps/search/?api=1&query=${q.posizione.lat},${q.posizione.lng}`;
  }
  const testo = [q.nome, q.indirizzo, "Roma"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(testo)}`;
}

/** Numero di telefono per i link tel: (solo cifre e +). */
export function telHref(n: string): string {
  return `tel:${n.replace(/[^\d+]/g, "")}`;
}

/** Link WhatsApp: wa.me vuole solo cifre col prefisso internazionale. */
export function whatsappHref(n: string): string {
  let d = n.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("3")) d = `39${d}`;
  return `https://wa.me/${d}`;
}
