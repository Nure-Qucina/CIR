"use client";

import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | undefined;

/** Carica Stripe.js solo su richiesta, riutilizzando la stessa istanza. */
export function getStripeClient(): Promise<Stripe | null> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  // Non memorizzare il risultato SSR: nel browser il caricamento deve ripartire.
  if (typeof window === "undefined" || !publishableKey)
    return Promise.resolve(null);

  stripePromise ??= loadStripe(publishableKey);
  return stripePromise;
}
