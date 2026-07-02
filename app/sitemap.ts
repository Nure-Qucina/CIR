import type { MetadataRoute } from "next";
import {
  getEventiSlugs,
  getEventoAvailableLocales,
} from "@/lib/content/eventi";
import {
  getArticoliSlugs,
  getArticoloAvailableLocales,
} from "@/lib/content/articoli";
import {
  getCategorie,
  getCategoriaAvailableLocales,
} from "@/lib/content/categorie";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function abs(pathname: string, locale: Locale): string {
  return `${SITE_URL}${getPathname({ locale, href: pathname })}`;
}

/**
 * Una riga di sitemap per ogni lingua disponibile per questo path, tutte con
 * lo stesso set di `alternates.languages` (§9 brief i18n: URL localizzate +
 * alternates.languages, senza dichiarare tradotte le lingue che sono solo
 * fallback IT su eventi/articoli/categorie).
 */
function localizedEntries(
  pathname: string,
  availableLocales: readonly Locale[],
  rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = {};
  for (const loc of availableLocales) languages[loc] = abs(pathname, loc);
  languages["x-default"] = abs(pathname, routing.defaultLocale);

  return availableLocales.map((locale) => ({
    ...rest,
    url: abs(pathname, locale),
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventiSlugs, articoliSlugs, categorie] = await Promise.all([
    getEventiSlugs(),
    getArticoliSlugs(),
    getCategorie(),
  ]);

  const now = new Date();
  const ALL = routing.locales;

  const statiche: MetadataRoute.Sitemap = [
    ...localizedEntries("/", ALL, { lastModified: now, priority: 1 }),
    ...localizedEntries("/chi-siamo", ALL, { lastModified: now, priority: 0.8 }),
    ...localizedEntries("/eventi", ALL, { lastModified: now, priority: 0.8 }),
    ...localizedEntries("/news", ALL, { lastModified: now, priority: 0.8 }),
    ...localizedEntries("/contatti", ALL, { lastModified: now, priority: 0.6 }),
    ...localizedEntries("/privacy", ALL, { lastModified: now, priority: 0.3 }),
  ];

  const eventiUrls = (
    await Promise.all(
      eventiSlugs.map(async (slug) => {
        const locales = await getEventoAvailableLocales(slug);
        return localizedEntries(`/eventi/${slug}`, locales, {
          lastModified: now,
          priority: 0.6,
        });
      }),
    )
  ).flat();

  const articoliUrls = (
    await Promise.all(
      articoliSlugs.map(async (slug) => {
        const locales = await getArticoloAvailableLocales(slug);
        return localizedEntries(`/news/${slug}`, locales, {
          lastModified: now,
          priority: 0.6,
        });
      }),
    )
  ).flat();

  const categorieUrls = (
    await Promise.all(
      categorie.map(async (c) => {
        const locales = await getCategoriaAvailableLocales(c.slug);
        return localizedEntries(`/news/categoria/${c.slug}`, locales, {
          lastModified: now,
          priority: 0.5,
        });
      }),
    )
  ).flat();

  return [...statiche, ...eventiUrls, ...articoliUrls, ...categorieUrls];
}
