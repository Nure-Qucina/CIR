import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { HeroCentered } from "@/components/home/HeroCentered";
import { ValueCard } from "@/components/home/ValueCard";
import { StoriaTimeline } from "@/components/home/StoriaTimeline";
import { MediaBlock } from "@/components/home/MediaBlock";
import { DonateBanner } from "@/components/home/DonateBanner";
import { ArticleCard } from "@/components/news/ArticleCard";
import { LangBadge } from "@/components/ui/LangBadge";
import { getEventi } from "@/lib/content/eventi";
import { getArticoli } from "@/lib/content/articoli";
import { getCategorieMap } from "@/lib/content/categorie";
import { getSiteConfig } from "@/lib/content/site";
import type { Valore, MomentoStoria } from "@/lib/data/cir";
import { formatDateIt, formatTimeIt, isoDate } from "@/lib/utils/date";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";

export const revalidate = 3600;

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
    alternates: buildAlternates("/", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, tEventi, ti, eventi, articoliEvidenza, categorieMap, site] =
    await Promise.all([
      getTranslations({ locale: locale as Locale, namespace: "home" }),
      getTranslations({ locale: locale as Locale, namespace: "eventi" }),
      getTranslations({ locale: locale as Locale, namespace: "istituzionale" }),
      getEventi(locale as Locale),
      getArticoli({ inEvidenza: true, locale: locale as Locale }),
      getCategorieMap(locale as Locale),
      getSiteConfig(),
    ]);
  const valori = ti.raw("valori") as Valore[];
  const storia = ti.raw("storia") as MomentoStoria[];

  // Evento in evidenza: il prossimo futuro, altrimenti l'ultimo passato.
  const featured = eventi.find((e) => !e.isPast) ?? eventi[0] ?? null;
  const newsHome = articoliEvidenza.slice(0, 4);

  return (
    <main id="contenuto">
      {/* A) HERO */}
      <HeroCentered locale={locale as Locale} />

      {/* B) Valori */}
      <section aria-labelledby="valori-home" className="bg-cream-50">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
              {t("valoriOcchiello")}
            </p>
            <h2
              id="valori-home"
              className="mt-3 text-[length:var(--text-h2)] font-bold text-balance text-ink"
            >
              {t("valoriTitolo")}
            </h2>
            <p className="mt-4 text-ink-soft">{t("valoriSottotitolo")}</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {valori.map((v, i) => (
              <ValueCard key={v.titolo} valore={v} index={i} />
            ))}
          </div>
        </Container>
      </section>

      {/* C) La nostra storia */}
      <section aria-labelledby="storia-home">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
                {t("storiaOcchiello")}
              </p>
              <h2
                id="storia-home"
                className="mt-3 text-[length:var(--text-h2)] font-bold text-balance text-ink"
              >
                {t("storiaTitolo")}
              </h2>
              <p className="mt-4 text-ink-soft">{t("storiaSottotitolo")}</p>
              <Button href="/chi-siamo" variant="ghost" className="mt-6">
                {t("scopriChiSiamo")}
                <ArrowRight size={16} className="rtl:rotate-180" aria-hidden />
              </Button>
            </div>
            <StoriaTimeline momenti={storia} />
          </div>
        </Container>
      </section>

      <SectionDivider accent="teal" />

      {/* D) Evento in evidenza */}
      {featured && (
        <section aria-labelledby="evento-home">
          <Container className="py-16 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
                  {t("eventoOcchiello")}
                </p>
                <h2
                  id="evento-home"
                  className="mt-3 text-[length:var(--text-h2)] font-bold text-ink"
                >
                  {featured.isPast ? t("ultimoEvento") : t("prossimoEvento")}
                </h2>
              </div>
              <Link
                href="/eventi"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline sm:inline-flex"
              >
                {t("tuttiGliEventi")}
                <ArrowRight size={15} className="rtl:rotate-180" aria-hidden />
              </Link>
            </div>

            <Card
              as="article"
              className="mt-8 grid overflow-hidden md:grid-cols-2"
            >
              <Link
                href={`/eventi/${featured.slug}`}
                className="relative block aspect-[16/10] md:aspect-auto"
                aria-hidden="true"
                tabIndex={-1}
              >
                <CoverImage
                  src={featured.copertina}
                  alt={featured.titolo}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </Link>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <span
                  className={
                    "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold " +
                    (featured.isPast
                      ? "bg-teal-100 text-teal-800"
                      : "bg-orange-100 text-orange-800")
                  }
                >
                  {featured.isPast
                    ? tEventi("eventoConcluso")
                    : tEventi("inProgramma")}
                </span>
                <h3 className="mt-3 flex flex-wrap items-center gap-2 text-2xl font-bold text-ink">
                  {featured.titolo}
                  {featured.isFallback && <LangBadge />}
                </h3>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-ink-soft">
                  <span className="flex items-center gap-2">
                    <Calendar size={15} className="text-teal" aria-hidden />
                    <time dateTime={isoDate(featured.dataInizio)}>
                      {formatDateIt(featured.dataInizio)}
                      {!featured.tuttoIlGiorno &&
                        ` · ${formatTimeIt(featured.dataInizio)}`}
                    </time>
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={15} className="text-teal" aria-hidden />
                    {[featured.luogo.nome, featured.luogo.citta]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-ink-soft">
                  {featured.estratto}
                </p>
                <div className="mt-6">
                  <Button href={`/eventi/${featured.slug}`}>
                    {t("dettagliEvento")}
                    <ArrowRight size={16} className="rtl:rotate-180" aria-hidden />
                  </Button>
                </div>
              </div>
            </Card>

            {featured.isPast && (
              <p className="mt-4 text-sm text-ink-soft">
                {t("nessunEventoInProgramma")}
              </p>
            )}
          </Container>
        </section>
      )}

      {/* E) News in evidenza */}
      {newsHome.length > 0 && (
        <section aria-labelledby="news-home" className="bg-cream-50">
          <Container className="py-16 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
                  {t("newsOcchiello")}
                </p>
                <h2
                  id="news-home"
                  className="mt-3 text-[length:var(--text-h2)] font-bold text-ink"
                >
                  {t("dalleNostre", { labelNews: site.labelNews })}
                </h2>
              </div>
              <Link
                href="/news"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline sm:inline-flex"
              >
                {t("tuttiGliArticoli")}
                <ArrowRight size={15} className="rtl:rotate-180" aria-hidden />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {newsHome.map((a) => (
                <ArticleCard
                  key={a.slug}
                  articolo={a}
                  categoria={categorieMap.get(a.categoria)}
                  locale={locale as Locale}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* F) Media e comunicazione */}
      <MediaBlock locale={locale as Locale} />

      {/* G) Sostieni il CIR */}
      <DonateBanner donazioniUrl={site.donazioniUrl} locale={locale as Locale} />
    </main>
  );
}
