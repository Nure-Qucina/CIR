import { hasLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import {
  DONATION_EMAIL_MAX,
  DONATION_FREQUENCIES,
  DONATION_MAX_CENTS,
  DONATION_MIN_CENTS,
  DONATION_NAME_MAX,
  DONATION_VISIBILITIES,
  type DonationFrequency,
  type DonationVisibility,
} from "./config";

export type DonationAmountResult =
  | { ok: true; amountCents: number }
  | { ok: false; error: "invalid_amount" | "below_minimum" | "above_maximum" };

export type CheckoutParseError =
  | "invalid_request"
  | "invalid_amount"
  | "below_minimum"
  | "above_maximum"
  | "invalid_locale"
  | "invalid_frequency"
  | "invalid_visibility"
  | "invalid_first_name"
  | "invalid_last_name"
  | "invalid_email"
  | "invalid_cover_processing_costs";

export type ParsedCheckoutRequest = {
  amountCents: number;
  locale: Locale;
  frequency: DonationFrequency;
  firstName: string;
  lastName: string;
  email: string;
  visibility: DonationVisibility;
  coverProcessingCosts: boolean;
};

const CHECKOUT_KEYS = new Set([
  "amount",
  "locale",
  "frequency",
  "firstName",
  "lastName",
  "email",
  "visibility",
  "coverProcessingCosts",
  "turnstileToken",
]);

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const NAME_PATTERN = /^(?=.*\p{L})[\p{L}\p{M} .'\u2019\u2018-]{1,80}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Importo in euro come testo (es. "25", "25.50", "25,50").
 * Nessun separatore delle migliaia, esponente o simbolo valuta.
 * Accetta solo stringhe: il chiamante deve preservare il testo dell'input,
 * senza convertirlo prima in un numero floating point.
 */
export function parseDonationAmount(value: unknown): DonationAmountResult {
  if (typeof value !== "string") return { ok: false, error: "invalid_amount" };

  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(value.trim());
  if (!match) return { ok: false, error: "invalid_amount" };

  const euros = match[1].replace(/^0+/, "") || "0";
  // Limita la conversione numerica prima di eseguirla, anche per input enormi.
  if (euros.length > String(Math.floor(DONATION_MAX_CENTS / 100)).length) {
    return { ok: false, error: "above_maximum" };
  }

  const amountCents =
    Number(euros) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (amountCents < DONATION_MIN_CENTS)
    return { ok: false, error: "below_minimum" };
  if (amountCents > DONATION_MAX_CENTS)
    return { ok: false, error: "above_maximum" };
  return { ok: true, amountCents };
}

export function parseDonationFrequency(
  value: unknown,
):
  | { ok: true; frequency: DonationFrequency }
  | { ok: false; error: "invalid_frequency" } {
  if (
    typeof value !== "string" ||
    !DONATION_FREQUENCIES.includes(value as DonationFrequency)
  ) {
    return { ok: false, error: "invalid_frequency" };
  }
  return { ok: true, frequency: value as DonationFrequency };
}

export function parseDonationVisibility(
  value: unknown,
):
  | { ok: true; visibility: DonationVisibility }
  | { ok: false; error: "invalid_visibility" } {
  if (
    typeof value !== "string" ||
    !DONATION_VISIBILITIES.includes(value as DonationVisibility)
  ) {
    return { ok: false, error: "invalid_visibility" };
  }
  return { ok: true, visibility: value as DonationVisibility };
}

export function parseDonorName(
  value: unknown,
): { ok: true; name: string } | { ok: false } {
  if (typeof value !== "string") return { ok: false };
  const name = value.trim();
  if (
    name.length < 1 ||
    name.length > DONATION_NAME_MAX ||
    CONTROL_CHARS.test(name) ||
    !NAME_PATTERN.test(name)
  ) {
    return { ok: false };
  }
  return { ok: true, name };
}

export function parseDonorEmail(
  value: unknown,
): { ok: true; email: string } | { ok: false } {
  if (typeof value !== "string") return { ok: false };
  const email = value.trim();
  const parts = email.split("@");
  if (
    email.length < 3 ||
    email.length > DONATION_EMAIL_MAX ||
    CONTROL_CHARS.test(email) ||
    email.includes("..") ||
    email.includes(" ") ||
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1] ||
    parts[0].startsWith(".") ||
    parts[0].endsWith(".") ||
    parts[1].startsWith(".") ||
    parts[1].endsWith(".") ||
    !EMAIL_PATTERN.test(email)
  ) {
    return { ok: false };
  }
  return { ok: true, email };
}

/**
 * Corpo POST /api/donazioni/checkout. Il server resta autoritativo:
 * campi mancanti, sconosciuti o malformati vengono rifiutati.
 */
export function parseCheckoutRequest(
  body: unknown,
):
  | { ok: true; value: ParsedCheckoutRequest }
  | { ok: false; error: CheckoutParseError } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "invalid_request" };
  }

  const record = body as Record<string, unknown>;
  if (Object.keys(record).some((key) => !CHECKOUT_KEYS.has(key))) {
    return { ok: false, error: "invalid_request" };
  }

  const parsedAmount = parseDonationAmount(record.amount);
  if (!parsedAmount.ok) return { ok: false, error: parsedAmount.error };

  if (
    typeof record.locale !== "string" ||
    !hasLocale(routing.locales, record.locale)
  ) {
    return { ok: false, error: "invalid_locale" };
  }

  const parsedFrequency = parseDonationFrequency(record.frequency);
  if (!parsedFrequency.ok) return parsedFrequency;

  const firstName = parseDonorName(record.firstName);
  if (!firstName.ok) return { ok: false, error: "invalid_first_name" };

  const lastName = parseDonorName(record.lastName);
  if (!lastName.ok) return { ok: false, error: "invalid_last_name" };

  const email = parseDonorEmail(record.email);
  if (!email.ok) return { ok: false, error: "invalid_email" };

  const visibility = parseDonationVisibility(record.visibility);
  if (!visibility.ok) return visibility;

  if (typeof record.coverProcessingCosts !== "boolean") {
    return { ok: false, error: "invalid_cover_processing_costs" };
  }

  return {
    ok: true,
    value: {
      amountCents: parsedAmount.amountCents,
      locale: record.locale,
      frequency: parsedFrequency.frequency,
      firstName: firstName.name,
      lastName: lastName.name,
      email: email.email,
      visibility: visibility.visibility,
      coverProcessingCosts: record.coverProcessingCosts,
    },
  };
}

export function parseTurnstileToken(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const token = (body as Record<string, unknown>).turnstileToken;
  return typeof token === "string" ? token : null;
}
