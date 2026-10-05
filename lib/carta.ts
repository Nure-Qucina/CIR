/**
 * Illustrazioni in carta intagliata del redesign "Il foglio" (public/images/carta).
 * Generate su Higgsfield (GPT Image 2.5) nello stile del carousel/reel social;
 * i sorgenti e lo script di ritaglio stanno fuori dal repo
 * (Desktop/CIR-sito-cliente/redesign-grafico).
 */
export type Illustrazione = { src: string; width: number; height: number };

const img = (nome: string, width: number, height: number): Illustrazione => ({
  src: `/images/carta/${nome}.webp`,
  width,
  height,
});

export const ILLUSTRAZIONI = {
  finestra: img("finestra-25", 1000, 1501), // col cartellino largo legato al bordo
  lanterna: img("lanterna", 600, 911),
  treccia: img("treccia", 512, 981),
  maniCuore: img("mani-cuore", 700, 775), // donazioni: mani che offrono un cuore che germoglia
  microfoni: img("microfoni", 700, 660),
  calendario: img("calendario", 700, 547),
  busta: img("busta", 700, 771),
  fumettoArancio: img("fumetto-arancio", 346, 298),
  fumettoTeal: img("fumetto-teal", 315, 305),
  libri: img("libri", 700, 876),
  documento: img("documento", 700, 773),
  mappa: img("mappa", 900, 434),
} as const;

export type NomeIllustrazione = keyof typeof ILLUSTRAZIONI;

/** Le quattro arcate dei valori, nello stesso ordine di `istituzionale.valori`. */
export const ARCATE_VALORI: Record<
  "heart" | "users" | "hand-helping" | "messages-square",
  Illustrazione
> = {
  heart: img("arco-1", 595, 987), // lanterna nella nicchia: fede
  users: img("arco-2", 599, 987), // treccia di strisce: unità nelle differenze
  "hand-helping": img("arco-3", 606, 987), // tavola sulla soglia: servizio
  "messages-square": img("arco-4", 606, 987), // fumetti sul ponte: dialogo
};

/** Le tappe del sentiero della storia, in ordine cronologico. */
export const TAPPE_STORIA: Illustrazione[] = [
  img("tappa-1", 900, 395), // germoglio
  img("tappa-2", 900, 374), // tavolo degli incontri
  img("tappa-3", 900, 313), // bandierine della manifestazione
  img("tappa-4", 900, 324), // arco della nascita del CIR
];

/**
 * Inclinazione leggera per le card "storte" (news, archivio eventi): scelta
 * dallo slug, quindi stabile tra un render e l'altro e diversa tra card vicine.
 */
const INCLINAZIONI = [
  "-rotate-[1.4deg]",
  "rotate-[0.9deg]",
  "-rotate-[0.6deg]",
  "rotate-[1.5deg]",
  "-rotate-[1deg]",
  "rotate-[0.5deg]",
];

export function inclinazione(slug: string) {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return INCLINAZIONI[h % INCLINAZIONI.length];
}
