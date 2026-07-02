import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryFilter } from "@/components/news/CategoryFilter";
import { ArticleGrid } from "@/components/news/ArticleGrid";
import { getArticoli } from "@/lib/content/articoli";
import {
  getCategorie,
  getCategorieMap,
  getCategoriaBySlug,
  getCategoriaAvailableLocales,
} from "@/lib/content/categorie";
import { getSiteConfig } from "@/lib/content/site";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categorie = await getCategorie();
  return routing.locales.flatMap((locale) =>
    categorie.map((c) => ({ locale, slug: c.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const [categoria, availableLocales] = await Promise.all([
    getCategoriaBySlug(slug, locale as Locale),
    getCategoriaAvailableLocales(slug),
  ]);
  if (!categoria) return { title: "Categoria non trovata" };
  return {
    title: categoria.nome,
    description: categoria.descrizione,
    alternates: buildAlternates(
      `/news/categoria/${slug}`,
      locale as Locale,
      availableLocales,
    ),
    openGraph: buildOgLocale(locale as Locale),
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);

  const [tc, categoria] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getCategoriaBySlug(slug, locale as Locale),
  ]);
  if (!categoria) notFound();

  const [articoli, categorie, categorieMap, site] = await Promise.all([
    getArticoli({ categoria: slug, locale: locale as Locale }),
    getCategorie(locale as Locale),
    getCategorieMap(locale as Locale),
    getSiteConfig(),
  ]);

  return (
    <main id="contenuto">
      <PageHeader
        occhiello={site.labelNews}
        titolo={categoria.nome}
        sottotitolo={categoria.descrizione}
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: site.labelNews, href: "/news" },
          { label: categoria.nome },
        ]}
      />
      <Container className="py-12 sm:py-16">
        <div className="mb-10">
          <CategoryFilter categorie={categorie} attiva={slug} locale={locale as Locale} />
        </div>
        <ArticleGrid
          articoli={articoli}
          categorieMap={categorieMap}
          locale={locale as Locale}
        />
      </Container>
    </main>
  );
}
