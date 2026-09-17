import { DONATION_MAX_CENTS } from "./config";

/** Default Stripe EEA card-like reference: 1.50% + €0.25. Estimate only. */
export const DEFAULT_FEE_REFERENCE_BPS = 150;
export const DEFAULT_FEE_REFERENCE_FIXED_CENTS = 25;

export type FeeReference = {
  bps: number;
  fixedCents: number;
};

export type ContributionResult =
  | {
      ok: true;
      donationCents: number;
      contributionCents: number;
      totalCents: number;
    }
  | { ok: false; error: "above_maximum" | "invalid_amount" };

function parseNonNegativeInt(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === "") return fallback;
  if (!/^\d{1,6}$/.test(value.trim())) return fallback;
  return Number(value.trim());
}

/**
 * Server-only reference rates. Not the actual Stripe charge for every method.
 * 150 bps + 25 cents are development/reference defaults, not CIR's live fee.
 * Production should set DONATION_FEE_REFERENCE_BPS and
 * DONATION_FEE_REFERENCE_FIXED_CENTS explicitly. Independent of the
 * client-selected payment method.
 */
export function getFeeReference(): FeeReference {
  const bps = parseNonNegativeInt(
    process.env.DONATION_FEE_REFERENCE_BPS,
    DEFAULT_FEE_REFERENCE_BPS,
  );
  const fixedCents = parseNonNegativeInt(
    process.env.DONATION_FEE_REFERENCE_FIXED_CENTS,
    DEFAULT_FEE_REFERENCE_FIXED_CENTS,
  );
  if (bps >= 10000) {
    return {
      bps: DEFAULT_FEE_REFERENCE_BPS,
      fixedCents: DEFAULT_FEE_REFERENCE_FIXED_CENTS,
    };
  }
  return { bps, fixedCents };
}

/**
 * Gross-up so the net after the configured reference fee is approximately
 * the chosen donation. Integer cents, ceil, overflow-safe.
 * total = ceil((donation + fixed) / (1 - bps/10000))
 */
export function processingContributionCents(
  donationCents: number,
  reference: FeeReference = {
    bps: DEFAULT_FEE_REFERENCE_BPS,
    fixedCents: DEFAULT_FEE_REFERENCE_FIXED_CENTS,
  },
): ContributionResult {
  if (
    !Number.isInteger(donationCents) ||
    donationCents < 0 ||
    !Number.isInteger(reference.bps) ||
    !Number.isInteger(reference.fixedCents) ||
    reference.bps < 0 ||
    reference.bps >= 10000 ||
    reference.fixedCents < 0
  ) {
    return { ok: false, error: "invalid_amount" };
  }

  const numerator =
    BigInt(donationCents + reference.fixedCents) * BigInt(10000);
  const denom = BigInt(10000) - BigInt(reference.bps);
  const total = (numerator + denom - BigInt(1)) / denom;
  const contribution = total - BigInt(donationCents);
  if (contribution < BigInt(0)) return { ok: false, error: "invalid_amount" };
  if (total > BigInt(DONATION_MAX_CENTS)) {
    return { ok: false, error: "above_maximum" };
  }
  return {
    ok: true,
    donationCents,
    contributionCents: Number(contribution),
    totalCents: Number(total),
  };
}

export function donationTotals(
  donationCents: number,
  coverProcessingCosts: boolean,
  reference?: FeeReference,
): ContributionResult {
  if (!coverProcessingCosts) {
    if (!Number.isInteger(donationCents) || donationCents < 0) {
      return { ok: false, error: "invalid_amount" };
    }
    if (donationCents > DONATION_MAX_CENTS) {
      return { ok: false, error: "above_maximum" };
    }
    return {
      ok: true,
      donationCents,
      contributionCents: 0,
      totalCents: donationCents,
    };
  }
  return processingContributionCents(donationCents, reference);
}
