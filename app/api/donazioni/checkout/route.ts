import { getPathname } from "@/i18n/navigation";
import {
  DONATION_CURRENCY,
  DONATION_PAYMENT_METHOD_TYPES,
  DONATION_ROUTE,
  getPublicSiteUrl,
} from "@/lib/donazioni/config";
import { authorizeDonationCheckout } from "@/lib/donazioni/checkout-guard";
import { donationMetadata } from "@/lib/donazioni/metadata";
import { getStripeServer, StripeConfigurationError } from "@/lib/stripe/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

function json(
  body: { error: string } | Record<string, unknown>,
  status: number,
  extraHeaders?: HeadersInit,
) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

function lineItems(
  monthly: boolean,
  donationCents: number,
  contributionCents: number,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const donation: Stripe.Checkout.SessionCreateParams.LineItem = {
    quantity: 1,
    price_data: {
      currency: DONATION_CURRENCY,
      unit_amount: donationCents,
      product_data: {
        name: monthly ? "CIR monthly donation" : "CIR donation",
      },
      ...(monthly ? { recurring: { interval: "month" as const } } : {}),
    },
  };
  if (contributionCents <= 0) return [donation];
  return [
    donation,
    {
      quantity: 1,
      price_data: {
        currency: DONATION_CURRENCY,
        unit_amount: contributionCents,
        product_data: {
          name: "Contributo stimato ai costi di transazione",
        },
        ...(monthly ? { recurring: { interval: "month" as const } } : {}),
      },
    },
  ];
}

export async function POST(request: Request): Promise<Response> {
  const guard = await authorizeDonationCheckout(request);
  if (!guard.ok) {
    const headers: Record<string, string> = {};
    if (guard.retryAfterSec) {
      headers["Retry-After"] = String(guard.retryAfterSec);
    }
    return json({ error: guard.error }, guard.status, headers);
  }

  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) return json({ error: "donations_not_configured" }, 503);

  const resultPath = getPathname({
    locale: guard.value.locale,
    href: `${DONATION_ROUTE}/esito`,
  });
  const returnUrl = `${siteUrl.origin}${resultPath}?session_id={CHECKOUT_SESSION_ID}`;
  const metadata = donationMetadata({
    frequency: guard.value.frequency,
    visibility: guard.value.visibility,
    firstName: guard.value.firstName,
    lastName: guard.value.lastName,
    locale: guard.value.locale,
    coverProcessingCosts: guard.value.coverProcessingCosts,
    donationCents: guard.donationCents,
    contributionCents: guard.contributionCents,
    totalCents: guard.totalCents,
  });
  const paymentMethodTypes = [...DONATION_PAYMENT_METHOD_TYPES];
  const monthly = guard.value.frequency === "monthly";
  const items = lineItems(
    monthly,
    guard.donationCents,
    guard.contributionCents,
  );

  try {
    const stripe = getStripeServer();
    const session = monthly
      ? await stripe.checkout.sessions.create({
          mode: "subscription",
          ui_mode: "elements",
          currency: DONATION_CURRENCY,
          adaptive_pricing: { enabled: false },
          payment_method_types: paymentMethodTypes,
          customer_email: guard.value.email,
          line_items: items,
          subscription_data: {
            description: "CIR monthly donation",
            metadata,
          },
          return_url: returnUrl,
          metadata,
        })
      : await stripe.checkout.sessions.create({
          mode: "payment",
          ui_mode: "elements",
          currency: DONATION_CURRENCY,
          adaptive_pricing: { enabled: false },
          payment_method_types: paymentMethodTypes,
          customer_email: guard.value.email,
          customer_creation: "always",
          line_items: items,
          return_url: returnUrl,
          metadata,
        });

    if (!session.client_secret) return json({ error: "checkout_failed" }, 500);
    return json(
      {
        clientSecret: session.client_secret,
        donationAmount: guard.donationCents,
        contributionAmount: guard.contributionCents,
        totalAmount: guard.totalCents,
      },
      200,
    );
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return json({ error: "donations_not_configured" }, 503);
    }
    return json({ error: "checkout_failed" }, 500);
  }
}
