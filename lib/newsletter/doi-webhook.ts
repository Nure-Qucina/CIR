import { isCirDonationPurpose } from "@/lib/donazioni/metadata";
import {
  metadataHasNewsletterConsent,
  shouldRequestNewsletterDoi,
} from "./doi-eligibility";
import type { NewsletterDoubleOptInInput } from "./doi-request";
import type { NewsletterDoiIdempotencyStore } from "./doi-idempotency";

export type NewsletterDoiStatus =
  "newsletter_doi_sent" | "newsletter_doi_skipped" | "newsletter_doi_failed";

export type NewsletterDoiSession = {
  id?: string | null;
  metadata?: Record<string, string> | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  payment_status?: string | null;
};

type NewsletterDoiRequestResult =
  { ok: true } | { ok: false; definitelyFailed: boolean };

export type NewsletterDoiDependencies = {
  newsletterEnabled: boolean;
  runtimeEnabled: boolean;
  getStore: () => Promise<NewsletterDoiIdempotencyStore>;
  request: (
    input: NewsletterDoubleOptInInput,
  ) => Promise<NewsletterDoiRequestResult>;
  createToken: () => string;
};

function sessionEmail(session: NewsletterDoiSession): string | null {
  const customerEmail = session.customer_email?.trim();
  if (customerEmail) return customerEmail;
  const detailsEmail = session.customer_details?.email?.trim();
  return detailsEmail || null;
}

export async function requestNewsletterDoiForCheckoutSession(
  eventType: string,
  session: NewsletterDoiSession,
  dependencies: NewsletterDoiDependencies,
): Promise<NewsletterDoiStatus> {
  if (!isCirDonationPurpose(session.metadata)) {
    return "newsletter_doi_skipped";
  }
  if (!dependencies.runtimeEnabled || !dependencies.newsletterEnabled) {
    return "newsletter_doi_skipped";
  }

  const consented = metadataHasNewsletterConsent(session.metadata);
  if (
    !shouldRequestNewsletterDoi({
      newsletterEnabled: dependencies.newsletterEnabled,
      consented,
      eventType,
      paymentStatus: session.payment_status,
    })
  ) {
    return "newsletter_doi_skipped";
  }

  const email = sessionEmail(session);
  const firstName = session.metadata?.donor_first_name?.trim();
  const lastName = session.metadata?.donor_last_name?.trim();
  const locale = session.metadata?.locale?.trim();
  if (!session.id || !email) {
    return "newsletter_doi_skipped";
  }

  let store: NewsletterDoiIdempotencyStore;
  let token: string;
  try {
    store = await dependencies.getStore();
    token = dependencies.createToken();
    if (!(await store.claim(session.id, token))) {
      return "newsletter_doi_skipped";
    }
  } catch {
    return "newsletter_doi_failed";
  }

  let result: NewsletterDoiRequestResult;
  try {
    result = await dependencies.request({
      email,
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(locale ? { locale } : {}),
    });
  } catch {
    return "newsletter_doi_failed";
  }

  if (result.ok) {
    try {
      await store.markSent(session.id, token);
    } catch {
      // The pending lock still suppresses retries until its short TTL expires.
    }
    return "newsletter_doi_sent";
  }

  if (result.definitelyFailed) {
    try {
      await store.release(session.id, token);
    } catch {
      // A release failure must not affect the Stripe webhook response.
    }
  }
  return "newsletter_doi_failed";
}
