import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";
import { NEWSLETTER_CONFIRM_ROUTE } from "@/lib/newsletter/config";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsletter" });
  return {
    title: t("confirmedTitle"),
    description: t("confirmedBody"),
    robots: { index: false, follow: true },
    alternates: buildAlternates(NEWSLETTER_CONFIRM_ROUTE, locale),
    openGraph: buildOgLocale(locale),
  };
}

export default async function NewsletterConfirmedPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "newsletter" });
  const common = await getTranslations({ locale, namespace: "common" });

  return (
    <main id="contenuto">
      <PageHeader
        compact
        titolo={t("confirmedTitle")}
        crumbs={[
          { label: common("home"), href: "/" },
          { label: t("confirmedTitle") },
        ]}
      />
      <Container className="py-6 sm:py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <p className="text-ink text-lg leading-relaxed">
            {t("confirmedBody")}
          </p>
          <Button href="/" variant="primary">
            {t("confirmedCta")}
          </Button>
        </div>
      </Container>
    </main>
  );
}
