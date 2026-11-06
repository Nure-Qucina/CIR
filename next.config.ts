import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Header di sicurezza (audit 6/11/2026, P1.1).
 *
 * La CSP completa è OBBLIGATORIA sul sito pubblico (6/11/2026, dopo la prova
 * della pagina Dona fino al modulo Stripe: 0 violazioni). Su /keystatic e
 * /api/keystatic resta in "Report-Only" finché non si verifica l'editor
 * dopo il login GitHub: lì si applica solo la CSP minima.
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

const cspCompleta = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isDev ? "'unsafe-eval'" : "",
    "https://js.stripe.com https://*.js.stripe.com",
    "https://challenges.cloudflare.com",
    "https://va.vercel-scripts.com https://vercel.live",
  ].join(" "),
  // fonts.googleapis/gstatic: l'interfaccia di Keystatic carica Inter da Google.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
  [
    "img-src 'self' data: blob:",
    "https://tile.openstreetmap.org",
    "https://*.stripe.com https://*.link.com",
    "https://avatars.githubusercontent.com",
    "https://vercel.live https://vercel.com",
  ].join(" "),
  "font-src 'self' data: https://fonts.gstatic.com https://vercel.live https://assets.vercel.com",
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
  // Cassetta delle segnalazioni (app/api/csp-report): report-to per
  // Chrome/Edge (con l'header Reporting-Endpoints), report-uri per gli altri.
  "report-uri /api/csp-report",
  "report-to csp",
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const cspMinima = "frame-ancestors 'self'; object-src 'none'; base-uri 'self'";

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspCompleta },
  { key: "Reporting-Endpoints", value: 'csp="/api/csp-report"' },
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
    // Keystatic: CSP minima obbligatoria + completa in osservazione. Le regole
    // successive sovrascrivono le precedenti per la stessa chiave.
    const keystatic = [
      { key: "Content-Security-Policy", value: cspMinima },
      { key: "Content-Security-Policy-Report-Only", value: cspCompleta },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/keystatic/:path*", headers: keystatic },
      { source: "/api/keystatic/:path*", headers: keystatic },
    ];
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
