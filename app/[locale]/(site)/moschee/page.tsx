import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { MoscheeRubrica } from "@/components/rete/MoscheeRubrica";
import { SezioneVuota } from "@/components/rete/SezioneVuota";
import { getMoschee } from "@/lib/content/rete";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";
import { robotsRete } from "@/lib/content/site";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "rete.moschee",
  });
  return {
    title: t("titolo"),
    description: t("metaDescrizione"),
    alternates: buildAlternates("/moschee", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
    robots: await robotsRete(),
  };
}

/**
 * Niente rigenerazione a tempo: i contenuti stanno nei file del deploy e ogni
 * salvataggio Keystatic fa già un nuovo deploy. Rigenerare non porterebbe
 * dati nuovi ma costerebbe ISR writes: Next non produce un output identico
 * byte per byte (l'ordine dei pezzi in streaming cambia), quindi Vercel
 * conta ogni rigenerazione come una scrittura nuova.
 */
export const revalidate = false;

export default async function MoscheePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, tc, tn, moschee] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "rete.moschee" }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getTranslations({ locale: locale as Locale, namespace: "nav" }),
    getMoschee(),
  ]);

  return (
    <main id="contenuto">
      <PageHeader
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: tn("laRete") },
          { label: tn("moschee") },
        ]}
        occhiello={t("occhiello")}
        titolo={t("titolo")}
        sottotitolo={t("sottotitolo")}
        illustrazione="moschea"
      />
      <Container className="pb-16">
        {moschee.length > 0 ? (
          <MoscheeRubrica moschee={moschee} />
        ) : (
          <SezioneVuota titolo={t("vuotoTitolo")} testo={t("vuotoTesto")} />
        )}
      </Container>
    </main>
  );
}
