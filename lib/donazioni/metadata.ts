import type { Locale } from "@/i18n/routing";
import type { DonationFrequency, DonationVisibility } from "./config";

export type DonationMetadata = {
  purpose: "cir_donation";
  frequency: DonationFrequency;
  donor_visibility: DonationVisibility;
  donor_first_name: string;
  donor_last_name: string;
  locale: Locale;
  cover_processing_costs: "true" | "false";
  base_donation_amount_cents: string;
  processing_cost_contribution_cents: string;
  total_amount_cents: string;
};

export function donationMetadata(input: {
  frequency: DonationFrequency;
  visibility: DonationVisibility;
  firstName: string;
  lastName: string;
  locale: Locale;
  coverProcessingCosts: boolean;
  donationCents: number;
  contributionCents: number;
  totalCents: number;
}): DonationMetadata {
  return {
    purpose: "cir_donation",
    frequency: input.frequency,
    donor_visibility: input.visibility,
    donor_first_name: input.firstName,
    donor_last_name: input.lastName,
    locale: input.locale,
    cover_processing_costs: input.coverProcessingCosts ? "true" : "false",
    base_donation_amount_cents: String(input.donationCents),
    processing_cost_contribution_cents: String(input.contributionCents),
    total_amount_cents: String(input.totalCents),
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
