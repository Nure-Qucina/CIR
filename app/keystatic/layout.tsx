import KeystaticApp from "./keystatic";
import { KEYSTATIC_CHIUSO_MESSAGGIO, keystaticChiuso } from "@/lib/keystatic-guard";

/**
 * Root layout indipendente per l'admin Keystatic (segmento fuori da
 * app/[locale]: resta intenzionalmente non localizzato). Keystatic porta la
 * propria UI/stile completi — non serve il design system del sito.
 *
 * Su un deploy Vercel senza configurazione GitHub la UI non viene caricata
 * (lib/keystatic-guard): solo un avviso, niente modalità locale senza login.
 */
export default function RootLayout() {
  if (keystaticChiuso()) {
    return (
      <html lang="it">
        <head>
          <title>Redazione non disponibile</title>
        </head>
        <body style={{ fontFamily: "system-ui, sans-serif", margin: "15vh auto", maxWidth: 560, padding: "0 20px", lineHeight: 1.5 }}>
          <h1 style={{ fontSize: 22 }}>Redazione non disponibile</h1>
          <p>{KEYSTATIC_CHIUSO_MESSAGGIO}</p>
          <p>Il sito pubblico funziona normalmente. Per riattivare la redazione va
            impostata su Vercel la variabile NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG
            (con le altre variabili KEYSTATIC_*) e ripubblicato il sito.</p>
        </body>
      </html>
    );
  }
  return (
    <html lang="it">
      <body>
        <KeystaticApp />
      </body>
    </html>
  );
}
