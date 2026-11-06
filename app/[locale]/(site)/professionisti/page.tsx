import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProfessionistiElenco } from "@/components/rete/ProfessionistiElenco";
import { SezioneVuota } from "@/components/rete/SezioneVuota";
import { getProfessionisti } from "@/lib/content/rete";
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
    namespace: "rete.professionisti",
  });
  return {
    title: t("titolo"),
    description: t("metaDescrizione"),
    alternates: buildAlternates("/professionisti", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
    robots: await robotsRete(),
  };
}

export const revalidate = 3600;

export default async function ProfessionistiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [t, tc, tn, professionisti] = await Promise.all([
    getTranslations({
      locale: locale as Locale,
      namespace: "rete.professionisti",
    }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getTranslations({ locale: locale as Locale, namespace: "nav" }),
    getProfessionisti(locale as Locale),
  ]);

  return (
    <main id="contenuto">
      <PageHeader
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: tn("laRete") },
          { label: tn("professionisti") },
        ]}
        occhiello={t("occhiello")}
        titolo={t("titolo")}
        sottotitolo={t("sottotitolo")}
        illustrazione="valigetta"
      />
      <Container className="flex flex-col gap-10 pb-16">
        {professionisti.length > 0 ? (
          <ProfessionistiElenco professionisti={professionisti} />
        ) : (
          <SezioneVuota titolo={t("vuotoTitolo")} testo={t("vuotoTesto")} />
        )}
        <p className="text-ink-soft border-orange max-w-3xl border-s-[3px] ps-4 font-serif text-[15px] italic">
          {t("disclaimer")}
        </p>
      </Container>
    </main>
  );
}
