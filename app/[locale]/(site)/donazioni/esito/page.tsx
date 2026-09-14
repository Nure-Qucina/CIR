import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { routing, type Locale } from "@/i18n/routing";
import { DONATION_ROUTE } from "@/lib/donazioni/config";
import { DonationStatus } from "@/components/donazioni/DonationStatus";

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
  return { title: t("resultTitle"), robots: { index: false, follow: false } };
}

export default async function DonationResultPage({
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
        compact
        titolo={t("resultTitle")}
        crumbs={[
          { label: common("home"), href: "/" },
          { label: t("title"), href: DONATION_ROUTE },
          { label: t("resultTitle") },
        ]}
      />
      <Container className="py-6 sm:py-8">
        <Card className="mx-auto max-w-2xl p-6 sm:p-8">
          <DonationStatus />
        </Card>
      </Container>
    </main>
  );
}
