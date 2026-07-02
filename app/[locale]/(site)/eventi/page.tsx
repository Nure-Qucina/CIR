import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventTimeline } from "@/components/eventi/EventTimeline";
import { getEventi } from "@/lib/content/eventi";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Eventi",
    description:
      "Gli appuntamenti della Comunità Islamica di Roma: incontri, festività e iniziative aperte alla città. Prossimi eventi e archivio.",
    alternates: buildAlternates("/eventi", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
  };
}

// ISR: rigenera ogni ora.
export const revalidate = 3600;

export default async function EventiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, eventi] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "eventi" }),
    getEventi(locale as Locale),
  ]);

  return (
    <main id="contenuto">
      <PageHeader
        occhiello={t("occhiello")}
        titolo={t("titolo")}
        sottotitolo={t("sottotitolo")}
      />
      <Container className="py-12 sm:py-16">
        <Suspense fallback={null}>
          <EventTimeline eventi={eventi} />
        </Suspense>
      </Container>
    </main>
  );
}
