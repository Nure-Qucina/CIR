import "server-only";
import {
  BREVO_DOI_TIMEOUT_MS,
  isDonationNewsletterDoiRuntimeEnabled,
  readBrevoDoiConfig,
} from "./config";
import {
  buildBrevoDoubleOptInRequest,
  type NewsletterDoubleOptInInput,
} from "./doi-request";

export type NewsletterDoubleOptInResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        "runtime_disabled" | "not_configured" | "incomplete" | "request_failed";
    };

export { buildBrevoDoubleOptInRequest };
export type { NewsletterDoubleOptInInput };

/**
 * Double opt-in only. Never falls back to POST /v3/contacts.
 * Failures stay isolated from the donation / webhook result.
 * Currently returns `runtime_disabled` until Brevo setup is complete.
 */
export async function requestNewsletterDoubleOptIn(
  input: NewsletterDoubleOptInInput,
): Promise<NewsletterDoubleOptInResult> {
  if (!isDonationNewsletterDoiRuntimeEnabled()) {
    return { ok: false, reason: "runtime_disabled" };
  }

  const config = readBrevoDoiConfig();
  if (!config) return { ok: false, reason: "not_configured" };

  const email = input.email.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!email || !firstName || !lastName) {
    return { ok: false, reason: "incomplete" };
  }

  const request = buildBrevoDoubleOptInRequest(config, {
    email,
    firstName,
    lastName,
    locale: input.locale,
  });

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(BREVO_DOI_TIMEOUT_MS),
    });
    if (!response.ok) return { ok: false, reason: "request_failed" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "request_failed" };
  }
}
