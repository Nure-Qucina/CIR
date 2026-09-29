/** Server-side Brevo DOI config. Missing values never block donations. */

export const NEWSLETTER_CONFIRM_ROUTE = "/newsletter/confermata";
export const BREVO_DOI_ENDPOINT =
  "https://api.brevo.com/v3/contacts/doubleOptinConfirmation";
export const BREVO_DOI_TIMEOUT_MS = 8000;

export type BrevoDoiConfig = {
  apiKey: string;
  listId: number;
  templateId: number;
  redirectUrl: string;
};

export function parsePositiveInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{1,9}$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return parsed > 0 ? parsed : null;
}

export function parseBrevoRedirectUrl(value: unknown): URL | null {
  try {
    const url = new URL(typeof value === "string" ? value.trim() : "");
    const localHttp =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !localHttp) ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function readBrevoDoiConfig(
  env: Record<string, string | undefined> = process.env,
): BrevoDoiConfig | null {
  const apiKey = env.BREVO_API_KEY?.trim() ?? "";
  const listId = parsePositiveInt(env.BREVO_NEWSLETTER_LIST_ID);
  const templateId = parsePositiveInt(env.BREVO_DOI_TEMPLATE_ID);
  const redirectUrl = parseBrevoRedirectUrl(env.BREVO_DOI_REDIRECT_URL);
  if (!apiKey || listId === null || templateId === null || !redirectUrl) {
    return null;
  }
  return {
    apiKey,
    listId,
    templateId,
    redirectUrl: redirectUrl.toString(),
  };
}

export function isBrevoDoiReady(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return readBrevoDoiConfig(env) !== null;
}

export function isDonationNewsletterDoiRuntimeEnabled(
  value: unknown = process.env.DONATION_NEWSLETTER_DOI_RUNTIME_ENABLED,
): boolean {
  return value === "true";
}
