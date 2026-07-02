import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calendar, Clock, MapPin, ArrowUpRight, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";
import { AddToCalendar } from "@/components/eventi/AddToCalendar";
import { JsonLd } from "@/components/seo/JsonLd";
import { eventJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import {
  getEventoBySlug,
  getEventiSlugs,
  getEventoAvailableLocales,
} from "@/lib/content/eventi";
import { LangBadge } from "@/components/ui/LangBadge";
import { formatDateIt, formatTimeIt, isoDate } from "@/lib/utils/date";
import { buildIcs, googleCalendarUrl } from "@/lib/utils/ics";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getEventiSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const [evento, availableLocales] = await Promise.all([
    getEventoBySlug(slug, locale as Locale),
    getEventoAvailableLocales(slug),
  ]);
  if (!evento) return { title: "Evento non trovato" };
  return {
    title: evento.seo?.title || evento.titolo,
    description: evento.seo?.description || evento.estratto,
    alternates: buildAlternates(
      `/eventi/${slug}`,
      locale as Locale,
      availableLocales,
    ),
    openGraph: buildOgLocale(locale as Locale),
  };
}

function mapsUrl(luogo: {
  nome: string;
  indirizzo: string;
  citta: string;
  lat?: number;
  lng?: number;
}): string {
  if (luogo.lat && luogo.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${luogo.lat},${luogo.lng}`;
  }
  const q = encodeURIComponent(
    [luogo.nome, luogo.indirizzo, luogo.citta].filter(Boolean).join(", "),
  );
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default async function EventoPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const [t, tc, evento] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "eventi" }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getEventoBySlug(slug, locale as Locale),
  ]);
  if (!evento) notFound();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const ics = buildIcs(evento, siteUrl);
  const gcal = googleCalendarUrl(evento);
  const luogoCompleto = [
    evento.luogo.nome,
    evento.luogo.indirizzo,
    evento.luogo.citta,
  ]
    .filter(Boolean)
    .join(", ");

  const crumbs = [
    { label: tc("home"), href: "/" },
    { label: t("titolo"), href: "/eventi" },
    { label: evento.titolo },
  ];

  return (
    <main id="contenuto">
      <JsonLd
        data={[
          eventJsonLd(evento, locale as Locale),
          breadcrumbJsonLd(crumbs, locale as Locale),
        ]}
      />
      <Container className="py-10 sm:py-14">
        <Breadcrumbs crumbs={crumbs} className="mb-6" />

        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <article>
            <span
              className={
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold " +
                (evento.isPast
                  ? "bg-teal-100 text-teal-800"
                  : "bg-orange-100 text-orange-800")
              }
            >
              {evento.isPast ? t("eventoConcluso") : t("inProgramma")}
            </span>
            {evento.isFallback && (
              <LangBadge className="ms-2" />
            )}

            <h1 className="mt-4 text-[length:var(--text-h1)] leading-tight font-bold text-balance text-ink">
              {evento.titolo}
            </h1>

            {/* whitespace-pre-line: preserva gli a-capo inseriti in Keystatic
                (altrimenti l'HTML li collasserebbe in un unico blocco). */}
            <p className="mt-4 text-lg leading-relaxed whitespace-pre-line text-ink-soft">
              {evento.estratto}
            </p>

            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
              <CoverImage
                src={evento.copertina}
                alt={evento.titolo}
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>

            {evento.descrizione && (
              <div className="mt-8 text-lg leading-relaxed whitespace-pre-line text-ink">
                <p>{evento.descrizione}</p>
              </div>
            )}

            <div className="mt-10">
              <Link
                href="/eventi"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
              >
                <ArrowLeft size={15} className="rtl:rotate-180" aria-hidden />
                {t("tuttiGliEventi")}
              </Link>
            </div>
          </article>

          {/* Sidebar dettagli */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-bold text-ink">{tc("dettagli")}</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div className="flex gap-3">
                  <Calendar size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                  <div>
                    <dt className="font-semibold text-ink">{t("data")}</dt>
                    <dd className="text-ink-soft">
                      <time dateTime={isoDate(evento.dataInizio)}>
                        {formatDateIt(evento.dataInizio)}
                      </time>
                    </dd>
                  </div>
                </div>
                {!evento.tuttoIlGiorno && (
                  <div className="flex gap-3">
                    <Clock size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                    <div>
                      <dt className="font-semibold text-ink">{t("orario")}</dt>
                      <dd className="text-ink-soft">
                        {formatTimeIt(evento.dataInizio)}
                        {evento.dataFine && ` – ${formatTimeIt(evento.dataFine)}`}
                      </dd>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                  <div>
                    <dt className="font-semibold text-ink">{t("luogo")}</dt>
                    <dd className="text-ink-soft">{luogoCompleto}</dd>
                    <a
                      href={mapsUrl(evento.luogo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
                    >
                      {t("apriInGoogleMaps")}
                      <ArrowUpRight
                        size={14}
                        className="rtl:-scale-x-100"
                        aria-hidden
                      />
                    </a>
                  </div>
                </div>
              </dl>

              {evento.ctaEsterna?.url && (
                <Button
                  href={evento.ctaEsterna.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full"
                >
                  {evento.ctaEsterna.label || t("partecipa")}
                </Button>
              )}

              <div className="mt-6 border-t border-border pt-6">
                <p className="mb-3 text-sm font-semibold text-ink">
                  {t("aggiungiAlCalendario")}
                </p>
                <AddToCalendar
                  ics={ics}
                  googleUrl={gcal}
                  fileName={`${evento.slug}.ics`}
                />
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
