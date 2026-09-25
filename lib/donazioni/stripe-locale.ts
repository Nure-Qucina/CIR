import type { StripeElementLocale } from "@stripe/stripe-js";
import type { Locale } from "@/i18n/routing";

/**
 * Locales accepted by the installed `@stripe/stripe-js` `StripeElementLocale`
 * union (`loadStripe({ locale })` and Elements). Do not pass values outside
 * this set: Stripe.js rejects unknown locale identifiers.
 *
 * From `@stripe/stripe-js` 9.16.0 `StripeElementLocale`:
 * it, en, ar are valid. bn is not.
 */
export const STRIPE_ELEMENT_FALLBACK_LOCALE: StripeElementLocale = "en";

const CIR_TO_STRIPE: Record<Locale, StripeElementLocale> = {
  it: "it",
  en: "en",
  ar: "ar",
  bn: STRIPE_ELEMENT_FALLBACK_LOCALE,
};

export function stripeLocaleFromCir(locale: Locale): StripeElementLocale {
  return CIR_TO_STRIPE[locale];
}

export function stripeUsesFallbackLocale(locale: Locale): boolean {
  return stripeLocaleFromCir(locale) !== locale;
}
