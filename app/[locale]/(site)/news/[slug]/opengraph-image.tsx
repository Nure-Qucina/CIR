import { getTranslations } from "next-intl/server";
import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/ogTemplate";
import { getArticoloBySlug } from "@/lib/content/articoli";
import { getCategoriaBySlug } from "@/lib/content/categorie";
import type { Locale } from "@/i18n/routing";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Articolo — Comunità Islamica di Roma";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [t, articolo] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "news" }),
    getArticoloBySlug(slug, locale as Locale),
  ]);
  const categoria = articolo?.categoria
    ? await getCategoriaBySlug(articolo.categoria, locale as Locale)
    : null;

  return renderOg({
    occhiello:
      articolo?.tipo === "comunicato"
        ? t("comunicatoStampa")
        : categoria?.nome || t("ogArticolo"),
    titolo: articolo?.titolo || "Comunità Islamica di Roma",
    locale: locale as Locale,
  });
}
