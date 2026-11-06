import { getTranslations } from "next-intl/server";
import { renderOg, ogLocale, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/ogTemplate";
import { getArticoloBySlug } from "@/lib/content/articoli";
import { getCategoriaBySlug } from "@/lib/content/categorie";
import type { Locale } from "@/i18n/routing";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Articolo - Comunità Islamica di Roma";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: richiesta, slug } = await params;
  // ar/bn: anteprima italiana (vedi ogLocale).
  const locale = ogLocale(richiesta as Locale);
  const [t, articolo] = await Promise.all([
    getTranslations({ locale, namespace: "news" }),
    getArticoloBySlug(slug, locale),
  ]);
  const categoria = articolo?.categoria
    ? await getCategoriaBySlug(articolo.categoria, locale)
    : null;

  return renderOg({
    occhiello:
      articolo?.tipo === "comunicato"
        ? t("comunicatoStampa")
        : categoria?.nome || t("ogArticolo"),
    titolo: articolo?.titolo || "Comunità Islamica di Roma",
    locale,
  });
}
