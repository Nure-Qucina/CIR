import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryFilter } from "@/components/news/CategoryFilter";
import { ArticleGrid } from "@/components/news/ArticleGrid";
import { getArticoli } from "@/lib/content/articoli";
import {
  getCategorie,
  getCategorieMap,
  getCategoriaBySlug,
} from "@/lib/content/categorie";
import { getSiteConfig } from "@/lib/content/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categorie = await getCategorie();
  return categorie.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categoria = await getCategoriaBySlug(slug);
  if (!categoria) return { title: "Categoria non trovata" };
  return {
    title: categoria.nome,
    description: categoria.descrizione,
  };
}

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categoria = await getCategoriaBySlug(slug);
  if (!categoria) notFound();

  const [articoli, categorie, categorieMap, site] = await Promise.all([
    getArticoli({ categoria: slug }),
    getCategorie(),
    getCategorieMap(),
    getSiteConfig(),
  ]);

  return (
    <main id="contenuto">
      <PageHeader
        occhiello={site.labelNews}
        titolo={categoria.nome}
        sottotitolo={categoria.descrizione}
        crumbs={[
          { label: "Home", href: "/" },
          { label: site.labelNews, href: "/news" },
          { label: categoria.nome },
        ]}
      />
      <Container className="py-12 sm:py-16">
        <div className="mb-10">
          <CategoryFilter categorie={categorie} attiva={slug} />
        </div>
        <ArticleGrid articoli={articoli} categorieMap={categorieMap} />
      </Container>
    </main>
  );
}
