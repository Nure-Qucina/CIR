import { CSP_REPORT_MAX_BYTES, leggiSegnalazioni, rigaLog } from "@/lib/csp-report";

/**
 * Cassetta delle segnalazioni CSP: i browser dei visitatori inviano qui cosa
 * la Content Security Policy ha bloccato (o, su /keystatic, osservato).
 * Ogni segnalazione diventa una riga "[csp] …" nei log di Vercel
 * (Vercel → progetto cir → Logs, cerca "[csp]"). Vedi lib/csp-report.ts.
 *
 * Risponde sempre 204, senza contenuto: non rivela niente a chi scrive.
 */
const NIENTE = () => new Response(null, { status: 204, headers: { "cache-control": "no-store" } });

export async function POST(request: Request): Promise<Response> {
  const dichiarata = Number(request.headers.get("content-length") ?? "0");
  if (dichiarata > CSP_REPORT_MAX_BYTES) return NIENTE();

  // Lettura a pezzi: oltre 16 KB si smette di leggere (anche senza
  // content-length), così un corpo enorme non finisce in memoria.
  let testo = "";
  try {
    const lettore = request.body?.getReader();
    if (!lettore) return NIENTE();
    const pezzi: Uint8Array[] = [];
    let letti = 0;
    for (;;) {
      const { done, value } = await lettore.read();
      if (done) break;
      letti += value.byteLength;
      if (letti > CSP_REPORT_MAX_BYTES) {
        await lettore.cancel();
        return NIENTE();
      }
      pezzi.push(value);
    }
    testo = new TextDecoder().decode(Buffer.concat(pezzi));
  } catch {
    return NIENTE();
  }

  for (const s of leggiSegnalazioni(testo)) {
    console.warn(rigaLog(s));
  }
  return NIENTE();
}
