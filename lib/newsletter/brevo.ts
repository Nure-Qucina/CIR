import "server-only";
import {
  BREVO_DOI_TIMEOUT_MS,
  isDonationNewsletterDoiRuntimeEnabled,
  readBrevoDoiConfig,
} from "./config";
import {
  buildBrevoDoubleOptInRequest,
  safeBrevoErrorDetails,
  type NewsletterDoubleOptInInput,
} from "./doi-request";
import { parseDonorEmail } from "@/lib/donazioni/validation";

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

  const parsedEmail = parseDonorEmail(input.email);
  if (!parsedEmail.ok) {
    return { ok: false, definitelyFailed: true, reason: "incomplete" };
  }

  const request = buildBrevoDoubleOptInRequest(config, {
    ...input,
    email: parsedEmail.email,
  });

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(BREVO_DOI_TIMEOUT_MS),
    });
    if (!response.ok) {
      let responseBody: unknown;
      try {
        responseBody = await response.json();
      } catch {
        responseBody = undefined;
      }
      const safeDetails = safeBrevoErrorDetails(responseBody, [
        input.email,
        input.firstName,
        input.lastName,
      ]);
      console.warn("newsletter_doi_http_error", {
        status: response.status,
        ...safeDetails,
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
