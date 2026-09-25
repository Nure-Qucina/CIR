"use client";

import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe } from "@stripe/stripe-js";
import type { Locale } from "@/i18n/routing";
import { stripeLocaleFromCir } from "@/lib/donazioni/stripe-locale";

const stripePromises = new Map<string, Promise<Stripe | null>>();

/** Carica Stripe.js solo su richiesta, riutilizzando la stessa istanza. */
export function getStripeClient(locale: Locale = "it"): Promise<Stripe | null> {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  // Non memorizzare il risultato SSR: nel browser il caricamento deve ripartire.
  if (typeof window === "undefined" || !publishableKey)
    return Promise.resolve(null);

  const stripeLocale = stripeLocaleFromCir(locale);
  let stripePromise = stripePromises.get(stripeLocale);
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey, { locale: stripeLocale }).catch(
      (error) => {
        stripePromises.delete(stripeLocale);
        throw error;
      },
    );
    stripePromises.set(stripeLocale, stripePromise);
  }
  return stripePromise;
}
