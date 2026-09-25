import type { Locale } from "@/i18n/routing";
import type { DonationFrequency, DonationVisibility } from "./config";
import {
  newsletterConsentMetadata,
  type NewsletterConsentEvidence,
} from "./consent";

export type DonationMetadata = {
  purpose: "cir_donation";
  frequency: DonationFrequency;
  donor_visibility: DonationVisibility;
  donor_first_name: string;
  donor_last_name: string;
  locale: Locale;
  base_donation_amount_cents: string;
  total_amount_cents: string;
} & NewsletterConsentEvidence;

export function donationMetadata(input: {
  frequency: DonationFrequency;
  visibility: DonationVisibility;
  firstName: string;
  lastName: string;
  locale: Locale;
  donationCents: number;
  newsletterConsent: boolean;
  consentAt?: Date;
}): DonationMetadata {
  return {
    purpose: "cir_donation",
    frequency: input.frequency,
    donor_visibility: input.visibility,
    donor_first_name: input.firstName,
    donor_last_name: input.lastName,
    locale: input.locale,
    base_donation_amount_cents: String(input.donationCents),
    total_amount_cents: String(input.donationCents),
    ...newsletterConsentMetadata({
      consent: input.newsletterConsent,
      locale: input.locale,
      at: input.consentAt,
    }),
  };
}

export function isCirDonationPurpose(
  metadata: { purpose?: string } | null | undefined,
): boolean {
  return metadata?.purpose === "cir_donation";
}

export function donationFrequencyFromMetadata(
  metadata: { frequency?: string } | null | undefined,
  mode: "payment" | "subscription" | string,
): DonationFrequency | null {
  const value = metadata?.frequency;
  if (value === "one_time" || value === "monthly") return value;
  if (mode === "subscription") return "monthly";
  if (mode === "payment") return "one_time";
  return null;
}
