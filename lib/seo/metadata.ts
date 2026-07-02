import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/**
 * `alternates.canonical` + `alternates.languages` (hreflang) per una pagina.
 * `availableLocales`: quali lingue hanno DAVVERO questo contenuto tradotto.
 * Default: tutte — corretto per le pagine di chrome (home, chi-siamo, liste,
 * pagine legali…), strutturalmente disponibili in ogni lingua. Per eventi/
 * articoli va passato l'elenco filtrato per `isFallback` (§9 brief i18n: non
 * dichiarare tradotta una pagina che è solo fallback IT). `x-default` punta
 * sempre all'italiano.
 */
export function buildAlternates(
  pathname: string,
  currentLocale: Locale,
  availableLocales: readonly Locale[] = routing.locales,
) {
  const languages: Record<string, string> = {};
  for (const loc of availableLocales) {
    languages[loc] = getPathname({ locale: loc, href: pathname });
  }
  languages["x-default"] = getPathname({
    locale: routing.defaultLocale,
    href: pathname,
  });

  return {
    canonical: getPathname({ locale: currentLocale, href: pathname }),
    languages,
  };
}

const OG_LOCALE: Record<Locale, string> = {
  it: "it_IT",
  en: "en_US",
  ar: "ar_AR",
  bn: "bn_BD",
};

/**
 * `openGraph.locale` + `openGraph.alternateLocale` (§9 brief i18n), più i
 * campi base (`type`/`siteName`) — Next.js fa un merge *shallow* dei
 * metadata tra layout e pagina: se una pagina imposta un proprio `openGraph`
 * quello del layout viene rimpiazzato per intero, non unito. Includiamo
 * quindi qui l'intero oggetto invece di limitarci a `locale`.
 */
export function buildOgLocale(currentLocale: Locale) {
  return {
    type: "website" as const,
    siteName: "Comunità Islamica di Roma",
    locale: OG_LOCALE[currentLocale],
    alternateLocale: routing.locales
      .filter((l) => l !== currentLocale)
      .map((l) => OG_LOCALE[l]),
  };
}
