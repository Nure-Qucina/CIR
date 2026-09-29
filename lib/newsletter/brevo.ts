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
      definitelyFailed: boolean;
      reason:
        "runtime_disabled" | "not_configured" | "incomplete" | "request_failed";
    };

export { buildBrevoDoubleOptInRequest };
export type { NewsletterDoubleOptInInput };

/**
 * Double opt-in only. Never falls back to POST /v3/contacts.
 * Failures stay isolated from the donation / webhook result.
 * Runtime requests require DONATION_NEWSLETTER_DOI_RUNTIME_ENABLED=true.
 */
export async function requestNewsletterDoubleOptIn(
  input: NewsletterDoubleOptInInput,
): Promise<NewsletterDoubleOptInResult> {
  if (!isDonationNewsletterDoiRuntimeEnabled()) {
    return {
      ok: false,
      definitelyFailed: true,
      reason: "runtime_disabled",
    };
  }

  const config = readBrevoDoiConfig();
  if (!config) {
    return { ok: false, definitelyFailed: true, reason: "not_configured" };
  }

  const email = input.email.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!email || !firstName || !lastName) {
    return { ok: false, definitelyFailed: true, reason: "incomplete" };
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
    if (!response.ok) {
      console.warn("newsletter_doi_http_error", {
        status: response.status,
        reason: "brevo_non_2xx",
      });
      return {
        ok: false,
        definitelyFailed: response.status < 500,
        reason: "request_failed",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      definitelyFailed: false,
      reason: "request_failed",
    };
  }
}
