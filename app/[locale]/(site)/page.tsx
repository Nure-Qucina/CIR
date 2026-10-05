import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import Image from "next/image";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";
import { FoglioSezione } from "@/components/carta/FoglioSezione";
import { HeroFoglio } from "@/components/home/HeroFoglio";
import { ValoriFoglietti } from "@/components/home/ValoriFoglietti";
import { MediaBlock } from "@/components/home/MediaBlock";
import { DonateBanner } from "@/components/home/DonateBanner";
import { NewsletterBlock } from "@/components/home/NewsletterBlock";
import { ArticleCard } from "@/components/news/ArticleCard";
import { LangBadge } from "@/components/ui/LangBadge";
import { getEventi } from "@/lib/content/eventi";
import { getArticoli } from "@/lib/content/articoli";
import { getCategorieMap } from "@/lib/content/categorie";
import { getSiteConfig } from "@/lib/content/site";
import type { Valore } from "@/lib/data/cir";
import { formatDateIt, formatTimeIt, isoDate } from "@/lib/utils/date";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";
import { ILLUSTRAZIONI } from "@/lib/carta";

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

  // Evento in evidenza: il prossimo futuro, altrimenti l'ultimo passato.
  const featured = eventi.find((e) => !e.isPast) ?? eventi[0] ?? null;
  const newsHome = articoliEvidenza.slice(0, 4);

  return (
    <main id="contenuto">
      {/* A) HERO */}
      <HeroFoglio locale={locale as Locale} />

      {/* B) Valori: foglietti con gli oggetti ritagliati, su foglio teal. */}
      <FoglioSezione tono="teal" aria-labelledby="valori-home">
        <Container className="py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.2em] text-orange-200 uppercase">
              {t("valoriOcchiello")}
            </p>
            <h2
              id="valori-home"
              className="mt-3 text-[length:var(--text-h2)] font-bold text-balance"
            >
              {t("valoriTitolo")}
            </h2>
            <p className="text-cream/85 mt-4">{t("valoriSottotitoloBreve")}</p>
          </div>
          <ValoriFoglietti valori={valori} />
        </Container>
      </FoglioSezione>

      {/* C) Voci della comunità: le news, tra i valori e l'evento */}
      {newsHome.length > 0 && (
        <section aria-labelledby="news-home">
          <Container className="py-16 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-end gap-3 sm:gap-4">
                <Image
                  src={ILLUSTRAZIONI.documento.src}
                  width={ILLUSTRAZIONI.documento.width}
                  height={ILLUSTRAZIONI.documento.height}
                  alt=""
                  sizes="80px"
                  className="ritaglio h-auto w-14 shrink-0 -rotate-[8deg] sm:w-20"
                />
                <div>
                  <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
                    {t("newsOcchiello")}
                  </p>
                  <h2
                    id="news-home"
                    className="text-ink mt-3 text-[length:var(--text-h2)] font-bold"
                  >
                    {t("dalleNostre", { labelNews: site.labelNews })}
                  </h2>
                </div>
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

      {/* D) Evento in evidenza: foglio arancio */}
      {featured && (
        <div>
          <FoglioSezione tono="arancio" aria-labelledby="evento-home">
            <Container className="py-12 sm:py-16">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-ink/75 text-sm font-semibold tracking-[0.2em] uppercase">
                    {t("eventoOcchiello")}
                  </p>
                  <h2
                    id="evento-home"
                    className="text-ink mt-3 text-[length:var(--text-h2)] font-bold"
                  >
                    {featured.isPast ? t("ultimoEvento") : t("prossimoEvento")}
                  </h2>
                </div>
                <Link
                  href="/eventi"
                  className="text-ink hidden shrink-0 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline sm:inline-flex"
                >
                  {t("tuttiGliEventi")}
                  <ArrowRight
                    size={15}
                    className="rtl:rotate-180"
                    aria-hidden
                  />
                </Link>
              </div>

              <article className="foglio relative mt-8 grid -rotate-[0.5deg] items-center shadow-[0_20px_40px_rgb(98_52_19/0.35)] md:grid-cols-[1.15fr_1fr]">
                <Link
                  href={`/eventi/${featured.slug}`}
                  className="relative m-3 mb-0 block aspect-[16/9] overflow-hidden rounded-sm md:me-0 md:mb-3"
                  aria-hidden="true"
                  tabIndex={-1}
                >
                  <CoverImage
                    src={featured.copertina}
                    alt={featured.titolo}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </Link>
                <div className="flex flex-col justify-center p-6 lg:px-8">
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
                  <h3 className="text-ink mt-3 flex flex-wrap items-center gap-2 text-2xl font-bold">
                    {featured.titolo}
                    {featured.isFallback && <LangBadge />}
                  </h3>
                  <div className="text-ink-soft mt-3 flex flex-col gap-1.5 text-sm">
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
                  <p className="text-ink-soft mt-3 line-clamp-3 whitespace-pre-line">
                    {featured.estratto}
                  </p>
                  <div className="mt-6">
                    <Button href={`/eventi/${featured.slug}`}>
                      {t("dettagliEvento")}
                      <ArrowRight
                        size={16}
                        className="rtl:rotate-180"
                        aria-hidden
                      />
                    </Button>
                  </div>
                </div>
                <Image
                  src={ILLUSTRAZIONI.calendario.src}
                  width={ILLUSTRAZIONI.calendario.width}
                  height={ILLUSTRAZIONI.calendario.height}
                  alt=""
                  sizes="(max-width: 768px) 130px, 210px"
                  className="ritaglio pointer-events-none absolute -end-2 -bottom-9 h-auto w-[130px] md:-end-12 md:-bottom-14 md:w-[210px]"
                />
              </article>

              {featured.isPast && (
                <p className="text-ink mt-8 text-sm md:max-w-[70%]">
                  {t("nessunEventoInProgramma")}
                </p>
              )}
            </Container>
          </FoglioSezione>
        </div>
      )}

      {/* E) Newsletter: iscrizione con doppia conferma */}
      <NewsletterBlock locale={locale as Locale} />

      {/* F) Media e comunicazione */}
      <MediaBlock locale={locale as Locale} />

      {/* G) Sostieni il CIR */}
      <DonateBanner locale={locale as Locale} />
    </main>
  );
}
