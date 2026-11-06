import { getTranslations } from "next-intl/server";
import { renderOg, ogLocale, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/ogTemplate";
import { getEventoBySlug } from "@/lib/content/eventi";
import { formatDateIt } from "@/lib/utils/date";
import type { Locale } from "@/i18n/routing";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Evento - Comunità Islamica di Roma";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: richiesta, slug } = await params;
  // ar/bn: anteprima italiana (vedi ogLocale).
  const locale = ogLocale(richiesta as Locale);
  const [t, evento] = await Promise.all([
    getTranslations({ locale, namespace: "eventi" }),
    getEventoBySlug(slug, locale),
  ]);

  const meta = evento
    ? [
        formatDateIt(evento.dataInizio),
        [evento.luogo.nome, evento.luogo.citta].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return renderOg({
    occhiello: t("ogOcchiello"),
    titolo: evento?.titolo || "Comunità Islamica di Roma",
    meta,
    locale,
  });
}
