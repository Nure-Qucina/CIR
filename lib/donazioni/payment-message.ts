/**
 * Messaggio donatore da Stripe Checkout confirm / lastPaymentError.
 * Usa solo il testo localizzato di Stripe.js; ignora decline code e ID interni.
 */
export function donorPaymentMessage(
  error: { message?: unknown } | null | undefined,
  fallback: string,
): string {
  if (typeof error?.message !== "string") return fallback;
  const message = error.message.trim();
  if (!message) return fallback;
  if (
    /\b(?:pi|cus|sub|in|seti|cs|pm|ch|evt)_[A-Za-z0-9]+\b/.test(message) ||
    /^[a-z][a-z0-9_]*$/.test(message)
  ) {
    return fallback;
  }
  return message;
}
