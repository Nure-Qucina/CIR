import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SponsorElenco } from "@/components/rete/SponsorElenco";
import { SezioneVuota } from "@/components/rete/SezioneVuota";
import { Invito } from "@/components/rete/Invito";
import { getSponsor } from "@/lib/content/rete";
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
    namespace: "rete.sponsor",
  });
  return {
    title: t("titolo"),
    description: t("metaDescrizione"),
    alternates: buildAlternates("/sponsor", locale as Locale),
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

export default async function SponsorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, tc, tn, sponsor] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "rete.sponsor" }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getTranslations({ locale: locale as Locale, namespace: "nav" }),
    getSponsor(locale as Locale),
  ]);

  return (
    <main id="contenuto">
      <PageHeader
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: tn("laRete") },
          { label: tn("sponsor") },
        ]}
        occhiello={t("occhiello")}
        titolo={t("titolo")}
        sottotitolo={t("sottotitolo")}
        illustrazione="bottega"
      />
      <Container className="flex flex-col gap-12 pb-16">
        {sponsor.length > 0 ? (
          <SponsorElenco sponsor={sponsor} />
        ) : (
          <SezioneVuota titolo={t("vuotoTitolo")} testo={t("vuotoTesto")} />
        )}
        <Invito
          titolo={t("diventaTitolo")}
          testo={t("diventaTesto")}
          cta={t("diventaCta")}
          href="/contatti"
        />
      </Container>
    </main>
  );
}
