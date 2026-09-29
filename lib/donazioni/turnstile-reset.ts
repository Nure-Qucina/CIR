/** Tokens are single-use. Reset the widget after a failed checkout that stays on the form. */
export function shouldResetTurnstileAfterCheckout(input: {
  aborted: boolean;
  failed: boolean;
}): boolean {
  return input.failed && !input.aborted;
}
