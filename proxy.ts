import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Rilevamento/redirect lingua per il sito pubblico. Chiamato "proxy" (non
 * "middleware") perché da Next.js 16 la convenzione file è stata rinominata
 * — stessa funzionalità, solo nome cambiato (vedi Next 16 upgrade guide).
 *
 * Il matcher esclude /keystatic, /api, i file statici e le route interne di
 * Next: l'admin CMS resta intenzionalmente non localizzato.
 */
export const proxy = createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|keystatic|_next|_vercel|.*\\..*).*)"],
};
