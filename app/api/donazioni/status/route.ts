import Stripe from "stripe";
import { DONATION_CURRENCY } from "@/lib/donazioni/config";
import { getStripeServer, StripeConfigurationError } from "@/lib/stripe/server";

export const runtime = "nodejs";

const SESSION_ID = /^cs_[A-Za-z0-9_]{10,240}$/;

type DonationState = "paid" | "pending" | "unpaid";

function json(
  body:
    | { error: string }
    | { state: DonationState; amount: number; currency: string },
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
    session.mode === "payment" &&
    session.metadata?.purpose === "cir_donation" &&
    session.currency === DONATION_CURRENCY &&
    typeof session.amount_total === "number" &&
    Number.isInteger(session.amount_total) &&
    session.amount_total >= 0
  );
}

function donationState(session: Stripe.Checkout.Session): DonationState {
  if (session.payment_status === "paid") return "paid";
  // Sessione chiusa ma non ancora pagata: metodi asincroni / in elaborazione.
  if (session.status === "complete") return "pending";
  return "unpaid";
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
    const session =
      await getStripeServer().checkout.sessions.retrieve(sessionId);
    if (!isCirDonationSession(session))
      return json({ error: "not_found" }, 404);

    return json(
      {
        state: donationState(session),
        amount: session.amount_total as number,
        currency: DONATION_CURRENCY,
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
