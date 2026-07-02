import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Config richiesta da next-intl per ogni request: determina la lingua attiva
 * (fallback a `it` se il segmento non è una lingua valida) e carica il
 * catalogo messaggi corrispondente da `messages/{locale}.json`.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
