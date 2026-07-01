import type { MetadataRoute } from "next";
import { getEventiSlugs } from "@/lib/content/eventi";
import { getArticoliSlugs } from "@/lib/content/articoli";
import { getCategorie } from "@/lib/content/categorie";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [eventi, articoli, categorie] = await Promise.all([
    getEventiSlugs(),
    getArticoliSlugs(),
    getCategorie(),
  ]);

  const now = new Date();

  const statiche: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/chi-siamo`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/eventi`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/news`, lastModified: now, priority: 0.8 },
    { url: `${SITE_URL}/contatti`, lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/cookie`, lastModified: now, priority: 0.3 },
    { url: `${SITE_URL}/termini`, lastModified: now, priority: 0.3 },
  ];

  const eventiUrls: MetadataRoute.Sitemap = eventi.map((slug) => ({
    url: `${SITE_URL}/eventi/${slug}`,
    lastModified: now,
    priority: 0.6,
  }));

  const articoliUrls: MetadataRoute.Sitemap = articoli.map((slug) => ({
    url: `${SITE_URL}/news/${slug}`,
    lastModified: now,
    priority: 0.6,
  }));

  const categorieUrls: MetadataRoute.Sitemap = categorie.map((c) => ({
    url: `${SITE_URL}/news/categoria/${c.slug}`,
    lastModified: now,
    priority: 0.5,
  }));

  return [...statiche, ...eventiUrls, ...articoliUrls, ...categorieUrls];
}
