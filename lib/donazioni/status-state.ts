export type PublicDonationState = "paid" | "pending" | "unpaid";

const FAILED_TERMINAL = new Set([
  "canceled",
  "incomplete_expired",
  "unpaid",
  "paused",
]);

const PI_PENDING = new Set([
  "processing",
  "requires_action",
  "requires_confirmation",
  "requires_capture",
]);
const PI_FAILED = new Set(["canceled", "requires_payment_method"]);

export type PaymentIntentLike = { status?: string } | string | null | undefined;

export type InvoiceLike =
  | {
      status?: string | null;
      confirmation_secret?: unknown;
    }
  | string
  | null
  | undefined;

export type SubscriptionLike =
  | {
      status?: string;
      deleted?: boolean;
      latest_invoice?: InvoiceLike;
    }
  | string
  | null
  | undefined;

export type SessionLike = {
  mode?: string | null;
  status?: string | null;
  payment_status?: string | null;
  payment_intent?: PaymentIntentLike;
  subscription?: SubscriptionLike;
};

function piStatus(value: PaymentIntentLike): string | null {
  if (!value || typeof value === "string") return null;
  return typeof value.status === "string" ? value.status : null;
}

function fromPaymentIntent(status: string | null): PublicDonationState | null {
  if (!status) return null;
  if (status === "succeeded") return "paid";
  if (PI_PENDING.has(status)) return "pending";
  if (PI_FAILED.has(status)) return "unpaid";
  return null;
}

export function invoicePaymentState(
  invoice: InvoiceLike,
): PublicDonationState | null {
  if (!invoice || typeof invoice === "string") return null;
  if (invoice.status === "paid") return "paid";
  if (invoice.status === "void" || invoice.status === "uncollectible") {
    return "unpaid";
  }
  if (invoice.status === "open" || invoice.status === "draft") {
    const secret = invoice.confirmation_secret;
    const nestedIntent =
      secret && typeof secret === "object" && "payment_intent" in secret
        ? (secret as { payment_intent?: PaymentIntentLike }).payment_intent
        : null;
    return fromPaymentIntent(piStatus(nestedIntent)) ?? "pending";
  }
  return null;
}

/**
 * CIR non usa trial. Mensile `paid` solo se subscription `active` e
 * l'invoice rilevante è `paid` (SEPA asincrono non basta `active`).
 */
export function donationState(session: SessionLike): PublicDonationState {
  if (session.mode === "subscription") {
    const sub = session.subscription;
    if (!sub || typeof sub === "string" || sub.deleted) {
      return session.status === "complete" ? "pending" : "unpaid";
    }
    const status = sub.status ?? "";
    if (FAILED_TERMINAL.has(status)) return "unpaid";

    const invoiceState = invoicePaymentState(sub.latest_invoice);

    if (status === "active") {
      if (invoiceState === "paid") return "paid";
      if (invoiceState === "unpaid") return "unpaid";
      return "pending";
    }

    if (status === "incomplete" || status === "past_due") {
      if (invoiceState === "unpaid") return "unpaid";
      return "pending";
    }

    return session.status === "complete" ? "pending" : "unpaid";
  }

  if (session.payment_status === "paid") return "paid";
  const intent = fromPaymentIntent(piStatus(session.payment_intent));
  if (intent) return intent;
  if (session.status === "complete") return "pending";
  return "unpaid";
}

export function parseMetadataCents(value: string | undefined): number | null {
  if (!value || !/^\d{1,9}$/.test(value)) return null;
  return Number(value);
}

export function publicDonationAmounts(input: {
  amountTotal: number;
  metadata: Record<string, string> | null | undefined;
}): { amount: number; donationAmount: number; contributionAmount: number } {
  const donation = parseMetadataCents(
    input.metadata?.base_donation_amount_cents,
  );
  const contribution = parseMetadataCents(
    input.metadata?.processing_cost_contribution_cents,
  );
  if (
    donation !== null &&
    contribution !== null &&
    donation + contribution === input.amountTotal &&
    contribution >= 0
  ) {
    return {
      amount: input.amountTotal,
      donationAmount: donation,
      contributionAmount: contribution,
    };
  }
  return {
    amount: input.amountTotal,
    donationAmount: input.amountTotal,
    contributionAmount: 0,
  };
}

export function shouldSendInitialThankYou(
  eventType: string,
  paymentStatus: string | null | undefined,
): boolean {
  if (eventType === "checkout.session.async_payment_succeeded") return true;
  if (eventType === "checkout.session.completed") {
    return paymentStatus === "paid";
  }
  return false;
}

export function thankYouIdempotencyKey(checkoutSessionId: string): string {
  return `cir-donation-${checkoutSessionId}`;
}
