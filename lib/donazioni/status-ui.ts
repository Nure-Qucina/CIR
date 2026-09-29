/** Semantic feedback surfaces only. Icons + headings remain required. */
export const STATUS_CARD = {
  success:
    "flex items-start gap-3 rounded-2xl border border-status-success-border bg-status-success-bg p-5",
  pending:
    "flex items-start gap-3 rounded-2xl border border-status-pending-border bg-status-pending-bg p-5",
  error:
    "flex items-start gap-3 rounded-2xl border border-status-error-border bg-status-error-bg p-5",
} as const;

export const STATUS_ICON = {
  success: "mt-0.5 shrink-0 text-status-success",
  pending: "mt-0.5 shrink-0 text-status-pending",
  error: "mt-0.5 shrink-0 text-status-error",
} as const;

export const STATUS_ALERT = {
  error:
    "rounded-xl border border-status-error-border bg-status-error-bg p-3 text-sm text-status-error",
} as const;

export const FIELD_INVALID = "border-status-error-border";
