import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

const STEPS = ["amount", "payment", "confirm"] as const;

export type DonationStep = (typeof STEPS)[number];

const STEP_COPY: Record<
  DonationStep,
  "stepAmount" | "stepPayment" | "stepConfirm"
> = {
  amount: "stepAmount",
  payment: "stepPayment",
  confirm: "stepConfirm",
};

export function DonationProgress({ current }: { current: DonationStep }) {
  const t = useTranslations("donazioni");
  const currentIndex = STEPS.indexOf(current);

  return (
    <nav aria-label={t("progressLabel")} className="mb-5">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const done = index < currentIndex;
          const active = index === currentIndex;
          return (
            <li key={step} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex min-w-0 items-center gap-2 text-xs font-semibold",
                  active && "text-ink",
                  done && "text-teal",
                  !active && !done && "text-ink-soft",
                )}
                aria-current={active ? "step" : undefined}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                    active && "border-orange bg-orange text-ink",
                    done && "border-teal bg-teal text-white",
                    !active &&
                      !done &&
                      "border-border bg-cream-50 text-ink-soft",
                  )}
                >
                  {index + 1}
                </span>
                <span className="max-[429px]:sr-only">
                  {t(STEP_COPY[step])}
                </span>
              </span>
              {index < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "h-px min-w-3 flex-1",
                    index < currentIndex ? "bg-teal" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
