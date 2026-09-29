import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  /**
   * Il reader Keystatic legge content/ con percorsi costruiti a runtime, che
   * il file-tracing di Next non riesce a seguire: senza questa riga la cartella
   * non finisce nella funzione serverless, e quando l'ISR rigenera una pagina
   * (revalidate = 3600) trova zero articoli/eventi e un site.json assente.
   * Fino al 14/9 lo copriva per caso il logging [DIAG-TEMP] in reader.ts
   * (readdirSync su path.join(cwd, "content", …)); rimosso quello, le liste
   * sono diventate vuote in produzione.
   * La chiave è un glob sulle route: tutte le pagine sotto /[locale], nessuna
   * API (le route /api/donazioni non leggono content/).
   */
  outputFileTracingIncludes: {
    "/\\[locale\\]": ["./content/**/*"],
  },
};

export default withNextIntl(nextConfig);
