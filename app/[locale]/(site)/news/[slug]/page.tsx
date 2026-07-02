import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Clock, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CoverImage } from "@/components/ui/CoverImage";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { Prose } from "@/components/ui/Prose";
import { ShareButtons } from "@/components/news/ShareButtons";
import { ArticleCard } from "@/components/news/ArticleCard";
import { LangBadge } from "@/components/ui/LangBadge";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import {
  getArticoloBySlug,
  getArticoliSlugs,
  getArticoliCorrelati,
  getArticoloAvailableLocales,
} from "@/lib/content/articoli";
import { getCategoriaBySlug, getCategorieMap } from "@/lib/content/categorie";
import { getSiteConfig } from "@/lib/content/site";
import { formatDateIt, isoDate } from "@/lib/utils/date";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getArticoliSlugs();
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
  const [articolo, availableLocales] = await Promise.all([
    getArticoloBySlug(slug, locale as Locale),
    getArticoloAvailableLocales(slug),
  ]);
  if (!articolo) return { title: "Articolo non trovato" };
  return {
    title: articolo.seo?.title || articolo.titolo,
    description: articolo.seo?.description || articolo.estratto,
    alternates: buildAlternates(
      `/news/${slug}`,
      locale as Locale,
      availableLocales,
    ),
    openGraph: buildOgLocale(locale as Locale),
  };
}

export default async function ArticoloPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const [t, tc, articolo] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "news" }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getArticoloBySlug(slug, locale as Locale),
  ]);
  if (!articolo) notFound();

  const [categoria, correlatiRaw, categorieMap, site] = await Promise.all([
    articolo.categoria
      ? getCategoriaBySlug(articolo.categoria, locale as Locale)
      : Promise.resolve(null),
    getArticoliCorrelati(slug, articolo.categoria, 3, locale as Locale),
    getCategorieMap(locale as Locale),
    getSiteConfig(),
  ]);

  const crumbs = [
    { label: tc("home"), href: "/" },
    { label: site.labelNews, href: "/news" },
    { label: articolo.titolo },
  ];

  return (
    <main id="contenuto">
      <JsonLd
        data={[
          articleJsonLd(articolo, locale as Locale),
          breadcrumbJsonLd(crumbs, locale as Locale),
        ]}
      />
      <Container className="py-10 sm:py-14">
        <Breadcrumbs crumbs={crumbs} className="mb-6" />

        <article className="mx-auto max-w-3xl">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              {articolo.tipo === "comunicato" && (
                <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream">
                  {t("comunicatoStampa")}
                </span>
              )}
              {categoria && (
                <CategoryPill
                  color={categoria.colore}
                  href={`/news/categoria/${categoria.slug}`}
                >
                  {categoria.nome}
                </CategoryPill>
              )}
              {articolo.isFallback && <LangBadge />}
            </div>

            <h1 className="mt-4 text-[length:var(--text-h1)] leading-tight font-bold text-balance text-ink">
              {articolo.titolo}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              {articolo.estratto}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
              <span>{articolo.autore}</span>
              {articolo.dataPubblicazione && (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={isoDate(articolo.dataPubblicazione)}>
                    {formatDateIt(articolo.dataPubblicazione)}
                  </time>
                </>
              )}
              {articolo.tempoLettura ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} aria-hidden />
                    {t("minutiDiLettura", { minuti: articolo.tempoLettura })}
                  </span>
                </>
              ) : null}
            </div>
          </header>

          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
            <CoverImage
              src={articolo.copertina}
              alt={articolo.titolo}
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>

          <Prose className="mt-10">
            {articolo.corpo ? (
              <MDXRemote source={articolo.corpo} />
            ) : (
              <p>{articolo.estratto}</p>
            )}
          </Prose>

          <div className="mt-10 flex flex-col gap-6 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/news"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
            >
              <ArrowLeft size={15} className="rtl:rotate-180" aria-hidden />
              {t("tornaA", { labelNews: site.labelNews })}
            </Link>
            <ShareButtons titolo={articolo.titolo} />
          </div>
        </article>

        {correlatiRaw.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <h2 className="mb-6 text-2xl font-bold text-ink">
              {t("articoliCorrelati")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {correlatiRaw.map((a) => (
                <ArticleCard
                  key={a.slug}
                  articolo={a}
                  categoria={categorieMap.get(a.categoria)}
                  locale={locale as Locale}
                />
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
