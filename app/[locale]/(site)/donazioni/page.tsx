import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DonationForm } from "@/components/donazioni/DonationForm";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";
import { DONATION_ROUTE } from "@/lib/donazioni/config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "donazioni" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: buildAlternates(DONATION_ROUTE, locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
  };
}

export default async function DonationPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "donazioni" });
  const common = await getTranslations({ locale, namespace: "common" });
  return (
    <main id="contenuto">
      <PageHeader
        occhiello={t("eyebrow")}
        titolo={t("title")}
        sottotitolo={t("intro")}
        crumbs={[{ label: common("home"), href: "/" }, { label: t("title") }]}
      />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <DonationForm key={locale} locale={locale as Locale} />
        </div>
      </Container>
    </main>
  );
}
