import { renderOg, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/seo/ogTemplate";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Comunità Islamica di Roma";

// OG di default del sito. Nome/tagline restano in italiano (contenuto
// istituzionale, vedi §12 brief i18n) su ogni locale — nessun font di
// script necessario qui, il testo è sempre in caratteri latini.
export default async function Image() {
  return renderOg({
    occhiello: "Comunità Islamica di Roma",
    titolo: "Uniti per una comunità forte e consapevole",
  });
}
