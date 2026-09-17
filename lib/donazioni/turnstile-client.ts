/**
 * Client-only Turnstile lifecycle. Tokens are single-use: after a token is
 * sent to checkout it is no longer fresh until a new widget callback.
 * Dummy Cloudflare test tokens may repeat the same string; a new callback
 * is still required before another submit.
 */

export type TurnstileClientState = {
  token: string;
  fresh: boolean;
};

export type CheckoutTurnstilePrep =
  | { ok: true; token: string; turnstile: TurnstileClientState }
  | { ok: false; reason: "busy" | "turnstile_not_ready" };

export function emptyTurnstileClientState(): TurnstileClientState {
  return { token: "", fresh: false };
}

export function isUsableTurnstileToken(token: unknown): token is string {
  return typeof token === "string" && token.length >= 8 && token.length <= 4096;
}

export function applyTurnstileCallback(
  _state: TurnstileClientState,
  token: string,
): TurnstileClientState {
  if (!isUsableTurnstileToken(token)) return emptyTurnstileClientState();
  return { token, fresh: true };
}

export function beginTurnstileReset(): TurnstileClientState {
  return emptyTurnstileClientState();
}

export function canSubmitDonationCheckout(input: {
  busy: boolean;
  turnstile: TurnstileClientState;
}): boolean {
  return (
    !input.busy &&
    input.turnstile.fresh &&
    isUsableTurnstileToken(input.turnstile.token)
  );
}

export function prepareDonationCheckout(input: {
  busy: boolean;
  turnstile: TurnstileClientState;
}): CheckoutTurnstilePrep {
  if (input.busy) return { ok: false, reason: "busy" };
  if (
    !input.turnstile.fresh ||
    !isUsableTurnstileToken(input.turnstile.token)
  ) {
    return { ok: false, reason: "turnstile_not_ready" };
  }
  return {
    ok: true,
    token: input.turnstile.token,
    turnstile: emptyTurnstileClientState(),
  };
}
