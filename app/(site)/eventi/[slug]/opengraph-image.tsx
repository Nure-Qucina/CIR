import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/ogTemplate";
import { getEventoBySlug } from "@/lib/content/eventi";
import { formatDateIt } from "@/lib/utils/date";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Evento — Comunità Islamica di Roma";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const evento = await getEventoBySlug(slug);

  const meta = evento
    ? [
        formatDateIt(evento.dataInizio),
        [evento.luogo.nome, evento.luogo.citta].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join(" · ")
    : undefined;

  return renderOg({
    occhiello: "Evento",
    titolo: evento?.titolo || "Comunità Islamica di Roma",
    meta,
  });
}
