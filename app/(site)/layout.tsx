import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { getSiteConfig } from "@/lib/content/site";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo/jsonLd";

/**
 * Layout del sito pubblico: header sticky + footer + skip-link.
 * Inietta il JSON-LD Organization + WebSite (presente su tutte le pagine).
 * Le rotte dell'admin Keystatic stanno fuori da questo gruppo.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSiteConfig();

  return (
    <>
      <JsonLd data={[organizationJsonLd(site), webSiteJsonLd(site)]} />
      <a href="#contenuto" className="skip-link">
        Vai al contenuto
      </a>
      <Header />
      {/* flex-1: riempie lo spazio residuo del body (flex-col, min-h-full) così
          il footer resta ancorato in fondo anche quando il contenuto è corto
          (es. filtro "Prossimi" senza eventi). */}
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </>
  );
}
