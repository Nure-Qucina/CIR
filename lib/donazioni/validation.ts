import { DONATION_MAX_CENTS, DONATION_MIN_CENTS } from "./config";

export type DonationAmountResult =
  | { ok: true; amountCents: number }
  | { ok: false; error: "invalid_amount" | "below_minimum" | "above_maximum" };

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
