import "server-only";
import Stripe from "stripe";

let stripe: Stripe | undefined;

export class StripeConfigurationError extends Error {
  constructor() {
    super("Stripe is not configured: set STRIPE_SECRET_KEY on the server.");
    this.name = "StripeConfigurationError";
  }
}

/** Inizializzazione lazy: import e build non richiedono credenziali Stripe. */
export function getStripeServer(): Stripe {
  if (stripe) return stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new StripeConfigurationError();

  stripe = new Stripe(secretKey);
  return stripe;
}
