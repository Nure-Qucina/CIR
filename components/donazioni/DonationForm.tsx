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

type Checkout = { clientSecret: string; stripe: Stripe };

function amountPayload(selected: number | "custom", custom: string): string {
  if (selected === "custom") return custom;
  const euros = selected / 100;
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2);
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
    if (checkout) heading.current?.focus();
  }, [checkout]);

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

  return (
    <Card className="p-6 sm:p-8">
      <h2
        ref={heading}
        tabIndex={-1}
        className="text-ink text-[length:var(--text-h3)] font-bold focus:outline-none"
      >
        {checkout ? t("paymentTitle") : t("chooseAmount")}
      </h2>
      <p className="text-ink-soft mt-2 text-sm">{t("oneTime")}</p>
      {checkout ? (
        <DonationPayment
          clientSecret={checkout.clientSecret}
          stripe={checkout.stripe}
          locale={locale}
          onBack={() => {
            setCheckout(null);
            setError("");
            requestAnimationFrame(() => heading.current?.focus());
          }}
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
            <Button
              type="button"
              variant={selected === "custom" ? "primary" : "ghost"}
              className="mt-3 w-full"
              aria-pressed={selected === "custom"}
              onClick={() => {
                setSelected("custom");
                setError("");
              }}
            >
              {t("customAmount")}
            </Button>
            {selected === "custom" && (
              <div className="mt-5">
                <label
                  htmlFor="donation-amount"
                  className="text-sm font-semibold"
                >
                  {t("customLabel")}
                </label>
                <div className="relative mt-2">
                  <input
                    ref={customInput}
                    autoFocus
                    id="donation-amount"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
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
                      "bg-surface text-ink focus-visible:outline-teal w-full rounded-xl border py-3 ps-4 pe-16 focus-visible:outline-2 focus-visible:outline-offset-2",
                      error ? "border-orange-400" : "border-border",
                    )}
                  />
                  <span
                    aria-hidden
                    className="text-ink-soft absolute end-4 top-3"
                  >
                    EUR
                  </span>
                </div>
              </div>
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
          <p className="text-ink-soft text-center text-sm">{t("secure")}</p>
        </form>
      )}
    </Card>
  );
}
