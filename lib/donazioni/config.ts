/** Configurazione v1 condivisa. Tutti gli importi sono in centesimi di euro. */
export const DONATION_ROUTE = "/donazioni";
export const DONATION_CURRENCY = "eur";
export const DONATION_PRESETS_CENTS = [1000, 2500, 5000, 10000] as const;
export const DONATION_DEFAULT_CENTS = 2500;
/** Lower bound for custom amounts; preset buttons remain fixed above. */
export const DONATION_CUSTOM_MIN_CENTS = 100;
export const DONATION_MAX_CENTS = 500000;
export const DONATION_NAME_MAX = 80;
export const DONATION_EMAIL_MAX = 254;
export const DONATION_FREQUENCIES = ["one_time", "monthly"] as const;
/** UI order: monthly first and selected by default. Enum values stay unchanged. */
export const DONATION_FREQUENCY_ORDER = ["monthly", "one_time"] as const;
export const DONATION_DEFAULT_FREQUENCY = "monthly" as const;
export const DONATION_VISIBILITIES = ["public", "anonymous"] as const;
/** UI order: public-hidden first and selected by default. */
export const DONATION_VISIBILITY_ORDER = ["anonymous", "public"] as const;
export const DONATION_DEFAULT_VISIBILITY = "anonymous" as const;
export const DONATION_PAYMENT_METHOD_TYPES = [
  "card",
  "link",
  "sepa_debit",
] as const;

export const DONATION_SESSION_COOKIE = "cir_donation_session";
export const DONATION_CSRF_HEADER = "x-donation-csrf";
export const DONATION_SESSION_TTL_SEC = 30 * 60;
export const DONATION_SESSION_SECRET_MIN = 32;

export const DONATION_RATE_SESSION_MAX = 5;
export const DONATION_RATE_SESSION_WINDOW_SEC = 10 * 60;
export const DONATION_RATE_IP_MAX = 10;
export const DONATION_RATE_IP_WINDOW_SEC = 60 * 60;
export const DONATION_RATE_EMAIL_MAX = 8;
export const DONATION_RATE_EMAIL_WINDOW_SEC = 60 * 60;
export const DONATION_RATE_MINT_MAX = 20;
export const DONATION_RATE_MINT_WINDOW_SEC = 60 * 60;
export const TURNSTILE_ACTION = "donation_checkout";

/** Cloudflare documented dummy widget sitekeys. Public test values, not CIR credentials. */
export const CLOUDFLARE_DUMMY_SITE_KEYS = [
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "3x00000000000000000000FF",
] as const;

/** Cloudflare documented dummy Siteverify secrets. Public test values, not CIR credentials. */
export const CLOUDFLARE_DUMMY_SECRETS = [
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
] as const;

/** Dummy secret whose Siteverify always passes and may omit `action`. */
export const CLOUDFLARE_DUMMY_PASS_SECRET =
  "1x0000000000000000000000000000000AA";

export function isCloudflareDummyTurnstileSiteKey(value: string): boolean {
  return (CLOUDFLARE_DUMMY_SITE_KEYS as readonly string[]).includes(
    value.trim(),
  );
}

export function isCloudflareDummyTurnstileSecret(value: string): boolean {
  return (CLOUDFLARE_DUMMY_SECRETS as readonly string[]).includes(value.trim());
}

export function hasCloudflareDummyTurnstileCredentials(): boolean {
  const siteKey = turnstileSiteKey() ?? "";
  const secret = turnstileSecretKey() ?? "";
  return (
    isCloudflareDummyTurnstileSiteKey(siteKey) ||
    isCloudflareDummyTurnstileSecret(secret)
  );
}

export type DonationFrequency = (typeof DONATION_FREQUENCIES)[number];
export type DonationVisibility = (typeof DONATION_VISIBILITIES)[number];

/** Da chiamare sul server con process.env.DONATIONS_ENABLED: solo "true" abilita. */
export function isDonationsEnabled(value: unknown): boolean {
  return value === "true";
}

/** Initial Step 1 UI: monthly first/default, name hidden from public display. */
export function initialDonationFormState() {
  return {
    frequency: DONATION_DEFAULT_FREQUENCY,
    frequencyOrder: DONATION_FREQUENCY_ORDER,
    visibility: DONATION_DEFAULT_VISIBILITY,
    visibilityOrder: DONATION_VISIBILITY_ORDER,
    newsletterConsent: false,
    newsletterEnabled: false,
  } as const;
}

/**
 * Shows the donation-form newsletter checkbox only when exactly `"true"`.
 * Keep off until Brevo DOI (list, template, authenticated domain) is ready.
 */
export function isDonationNewsletterEnabled(
  value: unknown = process.env.DONATION_NEWSLETTER_ENABLED,
): boolean {
  return value === "true";
}

export function isProductionDeployment(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  );
}

/**
 * Origine pubblica del sito per return_url Stripe / portale.
 * Deve essere un origin puro (https, o http solo su localhost).
 */
export function getPublicSiteUrl(): URL | null {
  try {
    const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "");
    const localHttp =
      siteUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(siteUrl.hostname);
    if (
      (siteUrl.protocol !== "https:" && !localHttp) ||
      siteUrl.username ||
      siteUrl.password ||
      siteUrl.pathname !== "/" ||
      siteUrl.search ||
      siteUrl.hash
    ) {
      return null;
    }
    return siteUrl;
  } catch {
    return null;
  }
}

/**
 * URL della pagina di login hosted del Customer Portal Stripe (no-code).
 * Deve essere `https://billing.stripe.com/p/login/...`, senza ID customer.
 */
export function parseCustomerPortalLoginUrl(
  value: string | null | undefined,
): URL | null {
  try {
    const portalUrl = new URL(value?.trim() ?? "");
    if (
      portalUrl.protocol !== "https:" ||
      portalUrl.hostname !== "billing.stripe.com" ||
      !/^\/p\/login\/[A-Za-z0-9_]+$/.test(portalUrl.pathname) ||
      portalUrl.username ||
      portalUrl.password ||
      portalUrl.search ||
      portalUrl.hash
    ) {
      return null;
    }
    return portalUrl;
  } catch {
    return null;
  }
}

export function getCustomerPortalLoginUrl(): URL | null {
  return parseCustomerPortalLoginUrl(
    process.env.STRIPE_CUSTOMER_PORTAL_LOGIN_URL,
  );
}

export function donationSessionSecret(): string | null {
  const secret = process.env.DONATION_SESSION_SECRET?.trim() ?? "";
  if (secret.length < DONATION_SESSION_SECRET_MIN) return null;
  return secret;
}

export function turnstileSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
  return key || null;
}

export function turnstileSecretKey(): string | null {
  const key = process.env.TURNSTILE_SECRET_KEY?.trim() ?? "";
  return key || null;
}

export function upstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

/**
 * Checkout creation fails closed when donations are enabled and security
 * config is missing. Production never silently skips protection.
 */
export function donationSecurityReady(): boolean {
  if (
    !donationSessionSecret() ||
    !turnstileSecretKey() ||
    !turnstileSiteKey() ||
    !upstashConfigured() ||
    !getPublicSiteUrl()
  ) {
    return false;
  }
  if (isProductionDeployment() && hasCloudflareDummyTurnstileCredentials()) {
    return false;
  }
  return true;
}
