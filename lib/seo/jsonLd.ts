import type { Articolo, Evento, SiteConfig } from "@/lib/content/types";
import { isoDate } from "@/lib/utils/date";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function abs(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

/** schema.org/Organization — nel layout del sito. */
export function organizationJsonLd(site: SiteConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.nome,
    alternateName: site.sigla,
    url: SITE_URL,
    logo: abs("/LogoCir.png"),
    description: site.descrizione,
    areaServed: "Roma",
    sameAs: site.social.map((s) => s.url),
    ...(site.contatti.email && {
      contactPoint: {
        "@type": "ContactPoint",
        email: site.contatti.email,
        contactType: "customer support",
      },
    }),
  };
}

/** schema.org/WebSite + SearchAction. */
export function webSiteJsonLd(site: SiteConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.nome,
    url: SITE_URL,
    inLanguage: "it-IT",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/news?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** schema.org/Event sul dettaglio evento. */
export function eventJsonLd(evento: Evento) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.titolo,
    description: evento.estratto,
    startDate: evento.dataInizio,
    ...(evento.dataFine && { endDate: evento.dataFine }),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: evento.luogo.nome,
      address: {
        "@type": "PostalAddress",
        streetAddress: evento.luogo.indirizzo,
        addressLocality: evento.luogo.citta,
        addressCountry: "IT",
      },
    },
    ...(evento.copertina && { image: abs(evento.copertina) }),
    url: abs(`/eventi/${evento.slug}`),
    organizer: {
      "@type": "Organization",
      name: "Comunità Islamica di Roma",
      url: SITE_URL,
    },
  };
}

/** schema.org/Article o NewsArticle (in base a `tipo`) sul dettaglio articolo. */
export function articleJsonLd(articolo: Articolo) {
  return {
    "@context": "https://schema.org",
    "@type": articolo.tipo === "comunicato" ? "NewsArticle" : "Article",
    headline: articolo.titolo,
    description: articolo.estratto,
    datePublished: isoDate(articolo.dataPubblicazione),
    ...(articolo.dataModifica && {
      dateModified: isoDate(articolo.dataModifica),
    }),
    author: { "@type": "Organization", name: articolo.autore },
    publisher: {
      "@type": "Organization",
      name: "Comunità Islamica di Roma",
      logo: { "@type": "ImageObject", url: abs("/LogoCir.png") },
    },
    ...(articolo.copertina && { image: abs(articolo.copertina) }),
    url: abs(`/news/${articolo.slug}`),
    inLanguage: "it-IT",
  };
}

/** schema.org/BreadcrumbList per le pagine interne. */
export function breadcrumbJsonLd(crumbs: { label: string; href?: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href && { item: abs(c.href) }),
    })),
  };
}
