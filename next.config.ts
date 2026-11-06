import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Header di sicurezza (audit 6/11/2026, P1.1).
 *
 * La CSP completa è per ora in modalità "Report-Only": il browser segnala in
 * console cosa bloccherebbe, ma non blocca niente. Va resa obbligatoria
 * (Content-Security-Policy) dopo aver provato in Preview donazione con Stripe
 * di test, Turnstile, mappa moschee e Keystatic.
 *
 * script-src tiene 'unsafe-inline' perché le pagine sono statiche (SSG/ISR):
 * una CSP a nonce renderebbe dinamica ogni pagina. La protezione utile resta:
 * niente script da host non elencati, e i dati (es. il token GitHub di
 * Keystatic nel cookie) possono uscire solo verso gli host di connect-src.
 *
 * Host: Stripe.js/Elements/Link (docs.stripe.com/security/guide), Cloudflare
 * Turnstile, tile OpenStreetMap, Vercel Analytics/Speed Insights e toolbar
 * delle Preview (vercel.live), API GitHub per Keystatic.
 */
const isDev = process.env.NODE_ENV !== "production";

const cspReportOnly = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://js.stripe.com https://*.js.stripe.com",
    "https://challenges.cloudflare.com",
    "https://va.vercel-scripts.com https://vercel.live",
  ].join(" "),
  // fonts.googleapis/gstatic: l'interfaccia di Keystatic carica Inter da Google.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  [
    "img-src 'self' data: blob:",
    "https://tile.openstreetmap.org",
    "https://*.stripe.com https://*.link.com",
    "https://avatars.githubusercontent.com",
    "https://vercel.live https://vercel.com",
  ].join(" "),
  "font-src 'self' data: https://fonts.gstatic.com https://vercel.live",
  [
    "connect-src 'self'",
    "https://api.stripe.com https://link.com https://*.link.com",
    "https://challenges.cloudflare.com",
    // Keystatic in modalità GitHub: API + file del repo pubblico.
    "https://api.github.com https://raw.githubusercontent.com",
    "https://va.vercel-scripts.com https://vercel.live wss://ws-us3.pusher.com",
  ].join(" "),
  [
    "frame-src 'self' https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com",
    "https://link.com https://*.link.com",
    "https://challenges.cloudflare.com",
    "https://vercel.live",
  ].join(" "),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  // Obbligatoria da subito: solo regole che non possono rompere nulla.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Non dichiarare a tutti che il sito gira su Next.js (header X-Powered-By).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
  /**
   * MdxImage (foto nel corpo degli articoli) legge le misure dei file in
   * public/ con un percorso costruito a runtime: il tracer copierebbe allora
   * l'intera cartella public/ (~43 MB, e cresce con ogni upload) nella
   * funzione delle pagine news. Serve solo in build (pagine SSG): si esclude.
   * public/ resta servita dalla CDN come sempre.
   */
  outputFileTracingExcludes: {
    "/\\[locale\\]": ["./public/**/*"],
  },
};

export default withNextIntl(nextConfig);
