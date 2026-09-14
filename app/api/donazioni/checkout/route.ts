import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import {
  DONATION_CURRENCY,
  DONATION_ROUTE,
  isDonationsEnabled,
} from "@/lib/donazioni/config";
import { parseDonationAmount } from "@/lib/donazioni/validation";
import { getStripeServer, StripeConfigurationError } from "@/lib/stripe/server";

export const runtime = "nodejs";

function json(
  body: { error: string } | { clientSecret: string },
  status: number,
) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  if (!isDonationsEnabled(process.env.DONATIONS_ENABLED)) {
    return json({ error: "donations_disabled" }, 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => key !== "amount" && key !== "locale")
  ) {
    return json({ error: "invalid_request" }, 400);
  }

  const { amount, locale } = body as Record<string, unknown>;
  const parsedAmount = parseDonationAmount(amount);
  if (!parsedAmount.ok) return json({ error: parsedAmount.error }, 400);
  if (typeof locale !== "string" || !hasLocale(routing.locales, locale)) {
    return json({ error: "invalid_locale" }, 400);
  }

  let siteUrl: URL;
  try {
    siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "");
    const localHttp =
      siteUrl.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(siteUrl.hostname);
    if (
      (siteUrl.protocol !== "https:" && !localHttp) ||
      siteUrl.username ||
      siteUrl.password ||
      siteUrl.pathname !== "/" ||
      siteUrl.search ||
      siteUrl.hash
    ) {
      return json({ error: "donations_not_configured" }, 503);
    }
  } catch {
    return json({ error: "donations_not_configured" }, 503);
  }

  const resultPath = getPathname({ locale, href: `${DONATION_ROUTE}/esito` });
  // Il placeholder Stripe deve restare letterale, senza URL-encoding delle graffe.
  const returnUrl = `${siteUrl.origin}${resultPath}?session_id={CHECKOUT_SESSION_ID}`;

  try {
    const session = await getStripeServer().checkout.sessions.create({
      mode: "payment",
      ui_mode: "elements",
      currency: DONATION_CURRENCY,
      adaptive_pricing: { enabled: false },
      // Carta sempre; Link e PayPal solo se Stripe li ammette sulla sessione.
      // Apple Pay / Google Pay restano wallet sulla carta, in base a
      // dispositivo, browser e dominio. Nessun BNPL o metodo ecommerce locale.
      payment_method_types: ["card", "link", "paypal"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: DONATION_CURRENCY,
            unit_amount: parsedAmount.amountCents,
            product_data: { name: "CIR donation" },
          },
        },
      ],
      return_url: returnUrl,
      metadata: { purpose: "cir_donation", locale },
      // Email: ContactDetailsElement la raccoglie e valida prima della conferma.
    });

    if (!session.client_secret) return json({ error: "checkout_failed" }, 500);
    return json({ clientSecret: session.client_secret }, 200);
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return json({ error: "donations_not_configured" }, 503);
    }
    return json({ error: "checkout_failed" }, 500);
  }
}
