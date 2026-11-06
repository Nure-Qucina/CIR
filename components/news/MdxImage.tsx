import Image from "next/image";
import path from "node:path";
import { imageSizeFromFile } from "image-size/fromFile";

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * Misure reali (e percorso decodificato) di un'immagine locale in public/, lette quando
 * la pagina viene generata. null per URL esterni, percorsi fuori da public/
 * o file illeggibili.
 */
async function misureLocali(
  src: string,
): Promise<{ width: number; height: number; percorso: string } | null> {
  if (!src.startsWith("/") || src.startsWith("//")) return null;
  let relativo: string;
  try {
    relativo = decodeURIComponent(src.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  const file = path.join(PUBLIC_DIR, relativo);
  if (!file.startsWith(PUBLIC_DIR + path.sep)) return null;
  try {
    // Legge al massimo i primi 512 KB del file, non l'intera foto.
    const { width, height } = await imageSizeFromFile(file);
    return width && height ? { width, height, percorso: relativo } : null;
  } catch {
    return null;
  }
}

/**
 * Immagini nel corpo MDX degli articoli (audit 6/11/2026, P1.3): passano da
 * next/image come le copertine, quindi versione ridotta in WebP/AVIF per lo
 * schermo di chi legge, caricamento quando si arriva alla foto (lazy) e
 * spazio riservato con le misure vere (il testo non salta).
 * Resa visiva invariata: larghezza naturale, al massimo quella del testo.
 */
export async function MdxImage({
  src,
  alt,
  title,
}: React.ComponentProps<"img">) {
  if (typeof src !== "string" || !src) return null;
  const misure = await misureLocali(src);

  if (!misure) {
    // Immagine esterna o non leggibile: resta un <img> semplice, ma lazy.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt ?? ""} title={title} loading="lazy" decoding="async" />;
  }

  return (
    <Image
      // Percorso decodificato: next/image lo ricodifica una volta sola
      // (con quello già codificato, es. "Z%C3%BCrich", darebbe 404).
      src={misure.percorso}
      alt={alt ?? ""}
      title={title}
      width={misure.width}
      height={misure.height}
      sizes="(max-width: 768px) 100vw, 768px"
      style={{ height: "auto" }}
    />
  );
}
