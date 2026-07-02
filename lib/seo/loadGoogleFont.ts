/**
 * Scarica un font Google in formato TTF (richiesto da `next/og`/Satori, che
 * non legge woff2) per il solo testo effettivamente usato nell'immagine OG —
 * `text=` fa sì che Google Fonts restituisca un sottoinsieme minimo dei
 * glifi. Google Fonts sceglie il formato in base allo User-Agent: un client
 * che non riconosce come browser moderno (qualunque UA non-browser, es.
 * "node") riceve `format('truetype')`, l'unico che Satori sa leggere —
 * un browser reale riceverebbe woff2/woff.
 */
export async function loadGoogleFont(
  font: string,
  text: string,
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}&text=${encodeURIComponent(text)}`;
  const css = await fetch(url, {
    headers: { "User-Agent": "node" },
  }).then((res) => res.text());

  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match) {
    throw new Error(`loadGoogleFont: nessun font truetype trovato per "${font}"`);
  }

  const response = await fetch(match[1]);
  if (!response.ok) {
    throw new Error(`loadGoogleFont: download fallito per "${font}"`);
  }
  return response.arrayBuffer();
}
