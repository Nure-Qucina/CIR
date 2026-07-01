import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryFilter } from "@/components/news/CategoryFilter";
import { ArticleGrid } from "@/components/news/ArticleGrid";
import { getArticoli } from "@/lib/content/articoli";
import { getCategorie, getCategorieMap } from "@/lib/content/categorie";
import { getSiteConfig } from "@/lib/content/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { labelNews } = await getSiteConfig();
  return {
    title: labelNews,
    description:
      "Editoriali, approfondimenti e comunicati stampa della Comunità Islamica di Roma. Voci e storie oltre gli stereotipi.",
  };
}

export default async function NewsPage() {
  const [articoli, categorie, categorieMap, site] = await Promise.all([
    getArticoli(),
    getCategorie(),
    getCategorieMap(),
    getSiteConfig(),
  ]);

  return (
    <main id="contenuto">
      <PageHeader
        occhiello="Voci della comunità"
        titolo={site.labelNews}
        sottotitolo="Editoriali, approfondimenti e comunicati stampa: raccontiamo volti, storie e progetti, non etichette."
      />
      <Container className="py-12 sm:py-16">
        <div className="mb-10">
          <CategoryFilter categorie={categorie} />
        </div>
        <ArticleGrid articoli={articoli} categorieMap={categorieMap} />
      </Container>
    </main>
  );
}
