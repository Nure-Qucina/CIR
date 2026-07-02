import KeystaticApp from "./keystatic";

/**
 * Root layout indipendente per l'admin Keystatic (segmento fuori da
 * app/[locale]: resta intenzionalmente non localizzato). Keystatic porta la
 * propria UI/stile completi — non serve il design system del sito.
 */
export default function RootLayout() {
  return (
    <html lang="it">
      <body>
        <KeystaticApp />
      </body>
    </html>
  );
}
