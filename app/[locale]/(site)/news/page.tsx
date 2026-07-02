import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryFilter } from "@/components/news/CategoryFilter";
import { ArticleGrid } from "@/components/news/ArticleGrid";
import { getArticoli } from "@/lib/content/articoli";
import { getCategorie, getCategorieMap } from "@/lib/content/categorie";
import { getSiteConfig } from "@/lib/content/site";
import { routing, type Locale } from "@/i18n/routing";
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
  const [{ labelNews }, { locale }] = await Promise.all([
    getSiteConfig(),
    params,
  ]);
  return {
    title: labelNews,
    description:
      "Editoriali, approfondimenti e comunicati stampa della Comunità Islamica di Roma. Voci e storie oltre gli stereotipi.",
    alternates: buildAlternates("/news", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, articoli, categorie, categorieMap, site] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "news" }),
    getArticoli({ locale: locale as Locale }),
    getCategorie(locale as Locale),
    getCategorieMap(locale as Locale),
    getSiteConfig(),
  ]);

  return (
    <main id="contenuto">
      <PageHeader
        occhiello={t("occhiello")}
        titolo={site.labelNews}
        sottotitolo={t("sottotitolo")}
      />
      <Container className="py-12 sm:py-16">
        <div className="mb-10">
          <CategoryFilter categorie={categorie} locale={locale as Locale} />
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
