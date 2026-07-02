import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteConfig } from "@/lib/content/site";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/jsonLd";
import type { Locale } from "@/i18n/routing";

/**
 * Layout del sito pubblico: header sticky + footer + skip-link.
 * Inietta il JSON-LD Organization + WebSite (presente su tutte le pagine).
 * Le rotte dell'admin Keystatic stanno fuori da questo gruppo.
 */
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [site, t] = await Promise.all([
    getSiteConfig(),
    getTranslations({ locale: locale as Locale, namespace: "a11y" }),
  ]);

  return (
    <>
      <JsonLd
        data={[organizationJsonLd(site), webSiteJsonLd(site, locale as Locale)]}
      />
      <a href="#contenuto" className="skip-link">
        {t("vaiAlContenuto")}
      </a>
      <Header locale={locale as Locale} />
      {/* flex-1: riempie lo spazio residuo del body (flex-col, min-h-full) così
          il footer resta ancorato in fondo anche quando il contenuto è corto
          (es. filtro "Prossimi" senza eventi). */}
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer locale={locale as Locale} />
      <CookieBanner />
    </>
  );
}
