import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/ogTemplate";
import { getArticoloBySlug } from "@/lib/content/articoli";
import { getCategoriaBySlug } from "@/lib/content/categorie";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Articolo — Comunità Islamica di Roma";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const articolo = await getArticoloBySlug(slug);
  const categoria = articolo?.categoria
    ? await getCategoriaBySlug(articolo.categoria)
    : null;

  return renderOg({
    occhiello:
      articolo?.tipo === "comunicato"
        ? "Comunicato stampa"
        : categoria?.nome || "News",
    titolo: articolo?.titolo || "Comunità Islamica di Roma",
  });
}
