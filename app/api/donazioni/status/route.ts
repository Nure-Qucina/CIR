import Stripe from "stripe";
import {
  DONATION_CURRENCY,
  type DonationFrequency,
} from "@/lib/donazioni/config";
import {
  donationFrequencyFromMetadata,
  isCirDonationPurpose,
} from "@/lib/donazioni/metadata";
import {
  donationState,
  publicDonationAmounts,
} from "@/lib/donazioni/status-state";
import type { SessionLike } from "@/lib/donazioni/status-state";
import { getStripeServer, StripeConfigurationError } from "@/lib/stripe/server";

export const runtime = "nodejs";

const SESSION_ID = /^cs_[A-Za-z0-9_]{10,240}$/;

type DonationState = "paid" | "pending" | "unpaid";

function json(
  body:
    | { error: string }
    | {
        state: DonationState;
        amount: number;
        donationAmount: number;
        contributionAmount: number;
        currency: string;
        frequency: DonationFrequency;
      },
  status: number,
) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function parseSessionId(request: Request): string | null {
  const ids = new URL(request.url).searchParams.getAll("session_id");
  if (ids.length !== 1) return null;
  const sessionId = ids[0]?.trim() ?? "";
  return SESSION_ID.test(sessionId) ? sessionId : null;
}

function isCirDonationSession(session: Stripe.Checkout.Session): boolean {
  return (
    (session.mode === "payment" || session.mode === "subscription") &&
    isCirDonationPurpose(session.metadata) &&
    session.currency === DONATION_CURRENCY &&
    typeof session.amount_total === "number" &&
    Number.isInteger(session.amount_total) &&
    session.amount_total >= 0
  );
}

function isUnknownSession(error: unknown): boolean {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    (error.code === "resource_missing" || error.statusCode === 404)
  );
}

export async function GET(request: Request): Promise<Response> {
  const sessionId = parseSessionId(request);
  if (!sessionId) return json({ error: "invalid_session" }, 400);

  try {
    const session = await getStripeServer().checkout.sessions.retrieve(
      sessionId,
      {
        expand: [
          "payment_intent",
          "subscription",
          "subscription.latest_invoice",
        ],
      },
    );
    if (!isCirDonationSession(session))
      return json({ error: "not_found" }, 404);

    const frequency = donationFrequencyFromMetadata(
      session.metadata,
      session.mode,
    );
    if (!frequency) return json({ error: "not_found" }, 404);

    const amounts = publicDonationAmounts({
      amountTotal: session.amount_total as number,
      metadata: session.metadata,
    });

    return json(
      {
        state: donationState(session as SessionLike),
        amount: amounts.amount,
        donationAmount: amounts.donationAmount,
        contributionAmount: amounts.contributionAmount,
        currency: DONATION_CURRENCY,
        frequency,
      },
      200,
    );
  } catch (error) {
    if (
      error instanceof StripeConfigurationError ||
      error instanceof Stripe.errors.StripeAuthenticationError
    ) {
      return json({ error: "donations_not_configured" }, 503);
    }
    if (isUnknownSession(error)) return json({ error: "not_found" }, 404);
    return json({ error: "status_failed" }, 500);
  }
}
