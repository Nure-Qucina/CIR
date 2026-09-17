import Stripe from "stripe";
import { getStripeServer, StripeConfigurationError } from "@/lib/stripe/server";
import { handleDonationWebhookEvent } from "@/lib/donazioni/webhook";

export const runtime = "nodejs";

function json(body: { error?: string; received?: boolean }, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) return json({ error: "donations_not_configured" }, 503);

  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ error: "invalid_signature" }, 400);

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripeServer().webhooks.constructEvent(
      rawBody,
      signature,
      secret,
    );
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return json({ error: "donations_not_configured" }, 503);
    }
    return json({ error: "invalid_signature" }, 400);
  }

  try {
    await handleDonationWebhookEvent(event);
    return json({ received: true }, 200);
  } catch {
    return json({ error: "webhook_failed" }, 500);
  }
}
