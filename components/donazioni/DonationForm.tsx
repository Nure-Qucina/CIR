"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { Stripe } from "@stripe/stripe-js";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import {
  DONATION_CURRENCY,
  DONATION_DEFAULT_CENTS,
  DONATION_MIN_CENTS,
  DONATION_MAX_CENTS,
  DONATION_PRESETS_CENTS,
} from "@/lib/donazioni/config";
import { parseDonationAmount } from "@/lib/donazioni/validation";
import { getStripeClient } from "@/lib/stripe/client";
import { DonationPayment } from "./DonationPayment";
import { DonationProgress } from "./DonationProgress";
import { DonationTrust } from "./DonationTrust";

type Checkout = { clientSecret: string; stripe: Stripe };

function amountPayload(selected: number | "custom", custom: string): string {
  if (selected === "custom") return custom;
  const euros = selected / 100;
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function DonationForm({ locale }: { locale: Locale }) {
  const t = useTranslations("donazioni");
  const format = useFormatter();
  const money = (cents: number) =>
    format.number(cents / 100, {
      style: "currency",
      currency: DONATION_CURRENCY,
    });
  const [selected, setSelected] = useState<number | "custom">(
    DONATION_DEFAULT_CENTS,
  );
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const customInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!checkout) return;
    heading.current?.focus();
    heading.current?.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [checkout]);
  useEffect(() => {
    if (selected === "custom") customInput.current?.focus();
  }, [selected]);

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const amount = amountPayload(selected, custom);
    const parsed = parseDonationAmount(amount);
    if (!parsed.ok) {
      setError(
        t("invalidAmount", {
          min: money(DONATION_MIN_CENTS),
          max: money(DONATION_MAX_CENTS),
        }),
      );
      if (selected === "custom") customInput.current?.focus();
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    const abort = new AbortController();
    controller.current = abort;
    try {
      const stripe = await getStripeClient(locale);
      if (abort.signal.aborted) return;
      if (!stripe) {
        setError(t("unavailable"));
        return;
      }
      const response = await fetch("/api/donazioni/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, locale }),
        cache: "no-store",
        signal: abort.signal,
      });
      if (!response.ok) {
        setError(
          response.status === 503
            ? t("unavailable")
            : response.status === 400
              ? t("invalidRequest")
              : t("genericError"),
        );
        return;
      }
      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== "object" ||
        !("clientSecret" in data) ||
        typeof data.clientSecret !== "string" ||
        !data.clientSecret
      ) {
        setError(t("genericError"));
        return;
      }
      if (!abort.signal.aborted)
        setCheckout({ clientSecret: data.clientSecret, stripe });
    } catch {
      if (!abort.signal.aborted) setError(t("genericError"));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function goBack() {
    controller.current?.abort();
    setCheckout(null);
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
  }

  return (
    <Card className="p-6 sm:p-8">
      <DonationProgress current={checkout ? "payment" : "amount"} />
      <h2
        ref={heading}
        tabIndex={-1}
        className="text-ink scroll-mt-24 text-[length:var(--text-h3)] font-bold focus:outline-none"
      >
        {checkout ? t("paymentTitle") : t("chooseAmount")}
      </h2>
      <p className="text-ink-soft mt-2 text-sm">
        {checkout ? t("oneTime") : t("chooseHint")}
      </p>
      {!checkout ? (
        <p className="text-ink-soft mt-2 text-sm">{t("purpose")}</p>
      ) : null}
      {checkout ? (
        <DonationPayment
          key={checkout.clientSecret}
          clientSecret={checkout.clientSecret}
          stripe={checkout.stripe}
          locale={locale}
          onBack={goBack}
        />
      ) : (
        <form
          onSubmit={startCheckout}
          noValidate
          className="mt-6 space-y-6"
          aria-busy={busy}
        >
          <fieldset disabled={busy}>
            <legend className="sr-only">{t("chooseAmount")}</legend>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {DONATION_PRESETS_CENTS.map((cents) => (
                <Button
                  key={cents}
                  type="button"
                  variant={selected === cents ? "primary" : "ghost"}
                  aria-pressed={selected === cents}
                  onClick={() => {
                    setSelected(cents);
                    setError("");
                  }}
                >
                  {money(cents)}
                </Button>
              ))}
            </div>
            {selected === "custom" ? (
              <div className="border-orange mt-4 rounded-xl border bg-orange-50 p-4">
                <label
                  htmlFor="donation-amount"
                  className="text-sm font-semibold"
                >
                  {t("customLabel")}
                </label>
                <div className="relative mt-2">
                  <span
                    aria-hidden
                    className="text-ink pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 font-semibold"
                  >
                    €
                  </span>
                  <input
                    ref={customInput}
                    id="donation-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    enterKeyHint="done"
                    value={custom}
                    onChange={(event) => {
                      setCustom(event.target.value);
                      setError("");
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={
                      error
                        ? "donation-limits donation-error"
                        : "donation-limits"
                    }
                    className={cn(
                      "bg-surface text-ink focus-visible:outline-teal w-full rounded-xl border py-3 ps-10 pe-4 focus-visible:outline-2 focus-visible:outline-offset-2",
                      error ? "border-orange-400" : "border-orange",
                    )}
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="text-teal focus-visible:outline-teal mt-4 rounded-md text-start text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => {
                  setSelected("custom");
                  setError("");
                }}
              >
                {t("customAmount")}
              </button>
            )}
            <p id="donation-limits" className="text-ink-soft mt-4 text-sm">
              {t("limits", {
                min: money(DONATION_MIN_CENTS),
                max: money(DONATION_MAX_CENTS),
              })}
            </p>
          </fieldset>
          <div aria-live="assertive" aria-atomic="true">
            {error ? (
              <p
                id="donation-error"
                role="alert"
                className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800"
              >
                {error}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={busy}
            className="w-full whitespace-normal"
            size="lg"
          >
            {busy ? t("loading") : t("continue")}
          </Button>
          <p role="status" aria-live="polite" className="sr-only">
            {busy ? t("loading") : ""}
          </p>
          <DonationTrust />
        </form>
      )}
    </Card>
  );
}
