import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

/**
 * Rilevamento/redirect lingua per il sito pubblico. Chiamato "proxy" (non
 * "middleware") perché da Next.js 16 la convenzione file è stata rinominata
 * — stessa funzionalità, solo nome cambiato (vedi Next 16 upgrade guide).
 *
 * Il matcher esclude /keystatic, /api, /admin (strumenti redazione, es.
 * gestione bozze), i file statici e le route interne di Next: l'admin CMS
 * resta intenzionalmente non localizzato.
 *
 * Un URL senza prefisso (`/chi-siamo`) è SEMPRE italiano. Con il
 * rilevamento attivo next-intl lo risolverebbe invece col cookie
 * NEXT_LOCALE, che torna a `en` appena il browser tocca una qualsiasi
 * pagina `/en/...` (anche un prefetch): chi sceglieva IT e poi cliccava
 * Chi siamo/Eventi/News veniva rimandato in inglese.
 * Il rilevamento (cookie + Accept-Language) resta solo per il primo arrivo
 * sulla home, quando il cookie non c'è ancora.
 */
const withDetection = createMiddleware(routing);
const withoutDetection = createMiddleware({
  ...routing,
  localeDetection: false,
});

export function proxy(request: NextRequest) {
  const firstVisitToHome =
    request.nextUrl.pathname === "/" && !request.cookies.has("NEXT_LOCALE");
  return firstVisitToHome ? withDetection(request) : withoutDetection(request);
}

export const config = {
  matcher: ["/((?!api|keystatic|admin|_next|_vercel|.*\\..*).*)"],
};
