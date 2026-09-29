import { isDonationNewsletterEnabled } from "@/lib/donazioni/config";
import { shouldSendInitialThankYou } from "@/lib/donazioni/status-state";

export function metadataHasNewsletterConsent(
  metadata: { newsletter_consent?: string } | null | undefined,
): boolean {
  return metadata?.newsletter_consent === "true";
}

/**
 * Same verified-success window as the transactional thank-you.
 * Consent and the feature flag are additional gates. Renewals
 * (`invoice.paid`) are never eligible.
 */
export function shouldRequestNewsletterDoi(input: {
  newsletterEnabled?: boolean;
  consented: boolean;
  eventType: string;
  paymentStatus: string | null | undefined;
}): boolean {
  const enabled = input.newsletterEnabled ?? isDonationNewsletterEnabled();
  if (!enabled) return false;
  if (!input.consented) return false;
  return shouldSendInitialThankYou(input.eventType, input.paymentStatus);
}
