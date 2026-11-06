import { makeRouteHandler } from "@keystatic/next/route-handler";
import keystaticConfig from "@/keystatic.config";
import { KEYSTATIC_CHIUSO_MESSAGGIO, keystaticChiuso } from "@/lib/keystatic-guard";

// API route che serve l'editing Keystatic (lettura/scrittura file in local mode,
// OAuth GitHub in github mode).
const handlers = makeRouteHandler({
  config: keystaticConfig,
});

// Su un deploy Vercel senza configurazione GitHub la modalità locale (senza
// login) non si apre: 503 invece delle API di lettura/scrittura.
function chiuso(): Response {
  return new Response(KEYSTATIC_CHIUSO_MESSAGGIO, {
    status: 503,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  return keystaticChiuso() ? chiuso() : handlers.GET(request);
}

export async function POST(request: Request): Promise<Response> {
  return keystaticChiuso() ? chiuso() : handlers.POST(request);
}
