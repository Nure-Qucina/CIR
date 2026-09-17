"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { Stripe } from "@stripe/stripe-js";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import {
  DONATION_CSRF_HEADER,
  DONATION_CURRENCY,
  DONATION_DEFAULT_CENTS,
  DONATION_MIN_CENTS,
  DONATION_MAX_CENTS,
  DONATION_NAME_MAX,
  DONATION_EMAIL_MAX,
  DONATION_PRESETS_CENTS,
  type DonationFrequency,
  type DonationVisibility,
} from "@/lib/donazioni/config";
import {
  DEFAULT_FEE_REFERENCE_BPS,
  DEFAULT_FEE_REFERENCE_FIXED_CENTS,
  processingContributionCents,
} from "@/lib/donazioni/fees";
import {
  parseCheckoutRequest,
  parseDonationAmount,
} from "@/lib/donazioni/validation";
import {
  applyTurnstileCallback,
  beginTurnstileReset,
  canSubmitDonationCheckout,
  emptyTurnstileClientState,
  prepareDonationCheckout,
  type TurnstileClientState,
} from "@/lib/donazioni/turnstile-client";
import { shouldResetTurnstileAfterCheckout } from "@/lib/donazioni/turnstile-reset";
import { getStripeClient } from "@/lib/stripe/client";
import { DonationPayment } from "./DonationPayment";
import { DonationProgress } from "./DonationProgress";
import { DonationTrust } from "./DonationTrust";
import { TurnstileField } from "./TurnstileField";

type Checkout = {
  clientSecret: string;
  stripe: Stripe;
  frequency: DonationFrequency;
  donationCents: number;
  contributionCents: number;
  totalCents: number;
};

function amountPayload(selected: number | "custom", custom: string): string {
  if (selected === "custom") return custom;
  const euros = selected / 100;
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2);
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const fieldClass =
  "bg-surface text-ink focus-visible:outline-teal w-full rounded-xl border py-3 px-4 focus-visible:outline-2 focus-visible:outline-offset-2";

export function DonationForm({ locale }: { locale: Locale }) {
  const t = useTranslations("donazioni");
  const format = useFormatter();
  const money = (cents: number) =>
    format.number(cents / 100, {
      style: "currency",
      currency: DONATION_CURRENCY,
    });
  const [frequency, setFrequency] = useState<DonationFrequency>("one_time");
  const [visibility, setVisibility] = useState<DonationVisibility>("anonymous");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [coverCosts, setCoverCosts] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");
  const [turnstile, setTurnstile] = useState<TurnstileClientState>(
    emptyTurnstileClientState,
  );
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [feeBps, setFeeBps] = useState(DEFAULT_FEE_REFERENCE_BPS);
  const [feeFixed, setFeeFixed] = useState(DEFAULT_FEE_REFERENCE_FIXED_CENTS);
  const [selected, setSelected] = useState<number | "custom">(
    DONATION_DEFAULT_CENTS,
  );
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState<
    "amount" | "firstName" | "lastName" | "email" | ""
  >("");
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const lock = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const customInput = useRef<HTMLInputElement>(null);
  const firstNameInput = useRef<HTMLInputElement>(null);
  const lastNameInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);
  const pendingSecurityNotice = useRef(false);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/donazioni/session", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async (response) => {
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok || !data || typeof data !== "object") return;
        const record = data as Record<string, unknown>;
        if (typeof record.csrfToken === "string")
          setCsrfToken(record.csrfToken);
        if (typeof record.turnstileSiteKey === "string") {
          setTurnstileSiteKey(record.turnstileSiteKey);
        }
        const fee = record.feeReference;
        if (fee && typeof fee === "object") {
          const bps = (fee as { bps?: unknown }).bps;
          const fixed = (fee as { fixedCents?: unknown }).fixedCents;
          if (typeof bps === "number" && Number.isInteger(bps)) setFeeBps(bps);
          if (typeof fixed === "number" && Number.isInteger(fixed)) {
            setFeeFixed(fixed);
          }
        }
      })
      .catch(() => undefined);
    return () => abort.abort();
  }, []);
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

  const turnstileReady = canSubmitDonationCheckout({
    busy: false,
    turnstile,
  });
  const submitDisabled = busy || !turnstileReady;

  useEffect(() => {
    if (!turnstileReady || !pendingSecurityNotice.current) return;
    pendingSecurityNotice.current = false;
    setError("");
  }, [turnstileReady]);

  function amountLabel(cents: number) {
    return frequency === "monthly"
      ? t("perMonth", { amount: money(cents) })
      : money(cents);
  }

  function resetTurnstileWidget() {
    setTurnstile(beginTurnstileReset());
    setTurnstileReset((value) => value + 1);
  }

  function mapCheckoutError(status: number, code: string): string {
    if (status === 503) return t("unavailable");
    if (status === 429) return t("tooManyRequests");
    if (
      code === "invalid_amount" ||
      code === "below_minimum" ||
      code === "above_maximum"
    ) {
      return t("invalidAmount", {
        min: money(DONATION_MIN_CENTS),
        max: money(DONATION_MAX_CENTS),
      });
    }
    if (code === "invalid_first_name") return t("invalidFirstName");
    if (code === "invalid_last_name") return t("invalidLastName");
    if (code === "invalid_email") return t("invalidEmail");
    if (status === 400) return t("invalidRequest");
    return t("genericError");
  }

  function focusInvalid(field: typeof invalidField) {
    setInvalidField(field);
    if (field === "amount") customInput.current?.focus();
    if (field === "firstName") firstNameInput.current?.focus();
    if (field === "lastName") lastNameInput.current?.focus();
    if (field === "email") emailInput.current?.focus();
  }

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || busy) return;
    const amount = amountPayload(selected, custom);
    const parsed = parseCheckoutRequest({
      amount,
      locale,
      frequency,
      firstName,
      lastName,
      email,
      visibility,
      coverProcessingCosts: coverCosts,
    });
    if (!parsed.ok) {
      const message = mapCheckoutError(400, parsed.error);
      setError(message);
      if (parsed.error === "invalid_first_name") focusInvalid("firstName");
      else if (parsed.error === "invalid_last_name") focusInvalid("lastName");
      else if (parsed.error === "invalid_email") focusInvalid("email");
      else if (
        parsed.error === "invalid_amount" ||
        parsed.error === "below_minimum" ||
        parsed.error === "above_maximum"
      ) {
        focusInvalid(selected === "custom" ? "amount" : "");
      }
      return;
    }
    const prepared = prepareDonationCheckout({
      busy,
      turnstile,
    });
    if (!prepared.ok) {
      if (prepared.reason === "turnstile_not_ready") {
        pendingSecurityNotice.current = true;
        setError(t("securityCheckPending"));
      }
      return;
    }
    lock.current = true;
    setBusy(true);
    setTurnstile(prepared.turnstile);
    setError("");
    setInvalidField("");
    const abort = new AbortController();
    controller.current = abort;
    try {
      const stripe = await getStripeClient(locale);
      if (abort.signal.aborted) return;
      if (!stripe) {
        resetTurnstileWidget();
        setError(t("unavailable"));
        return;
      }
      const response = await fetch("/api/donazioni/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          [DONATION_CSRF_HEADER]: csrfToken,
        },
        body: JSON.stringify({
          amount,
          locale,
          frequency,
          firstName: parsed.value.firstName,
          lastName: parsed.value.lastName,
          email: parsed.value.email,
          visibility,
          coverProcessingCosts: coverCosts,
          turnstileToken: prepared.token,
        }),
        cache: "no-store",
        signal: abort.signal,
      });
      const data: unknown = await response.json().catch(() => null);
      const code =
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "string"
          ? data.error
          : "";
      if (
        shouldResetTurnstileAfterCheckout({
          aborted: abort.signal.aborted,
          failed: !response.ok,
        })
      ) {
        resetTurnstileWidget();
        setError(mapCheckoutError(response.status, code));
        return;
      }
      if (
        !data ||
        typeof data !== "object" ||
        !("clientSecret" in data) ||
        typeof data.clientSecret !== "string" ||
        !data.clientSecret
      ) {
        resetTurnstileWidget();
        setError(t("genericError"));
        return;
      }
      const donationAmount =
        "donationAmount" in data && typeof data.donationAmount === "number"
          ? data.donationAmount
          : parsed.value.amountCents;
      const contributionAmount =
        "contributionAmount" in data &&
        typeof data.contributionAmount === "number"
          ? data.contributionAmount
          : 0;
      const totalAmount =
        "totalAmount" in data && typeof data.totalAmount === "number"
          ? data.totalAmount
          : donationAmount + contributionAmount;
      if (!abort.signal.aborted)
        setCheckout({
          clientSecret: data.clientSecret,
          stripe,
          frequency: parsed.value.frequency,
          donationCents: donationAmount,
          contributionCents: contributionAmount,
          totalCents: totalAmount,
        });
    } catch {
      if (
        shouldResetTurnstileAfterCheckout({
          aborted: abort.signal.aborted,
          failed: true,
        })
      ) {
        resetTurnstileWidget();
        setError(t("genericError"));
      }
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function goBack() {
    controller.current?.abort();
    pendingSecurityNotice.current = false;
    setCheckout(null);
    setError("");
    setInvalidField("");
    resetTurnstileWidget();
    requestAnimationFrame(() => heading.current?.focus());
  }

  const amountError = invalidField === "amount";
  const parsedClientAmount = parseDonationAmount(
    amountPayload(selected, custom),
  );

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
        {checkout
          ? checkout.frequency === "monthly"
            ? t("monthly")
            : t("oneTime")
          : t("chooseHint")}
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
          frequency={checkout.frequency}
          donationCents={checkout.donationCents}
          contributionCents={checkout.contributionCents}
          totalCents={checkout.totalCents}
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
            <legend className="text-sm font-semibold">
              {t("frequencyLabel")}
            </legend>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  ["one_time", "oneTime"],
                  ["monthly", "monthly"],
                ] as const
              ).map(([value, labelKey]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold",
                    frequency === value
                      ? "border-orange bg-orange-50"
                      : "border-border bg-surface",
                  )}
                >
                  <input
                    type="radio"
                    name="donation-frequency"
                    value={value}
                    checked={frequency === value}
                    onChange={() => {
                      setFrequency(value);
                      setError("");
                    }}
                    className="accent-orange size-4 shrink-0"
                  />
                  <span>{t(labelKey)}</span>
                </label>
              ))}
            </div>
          </fieldset>
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
                    setInvalidField("");
                  }}
                  className="whitespace-normal"
                >
                  {amountLabel(cents)}
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
                    enterKeyHint="next"
                    value={custom}
                    onChange={(event) => {
                      setCustom(event.target.value);
                      setError("");
                      setInvalidField("");
                    }}
                    aria-invalid={amountError}
                    aria-describedby={
                      error
                        ? "donation-limits donation-error"
                        : "donation-limits"
                    }
                    className={cn(
                      fieldClass,
                      "ps-10",
                      amountError ? "border-orange-400" : "border-orange",
                    )}
                  />
                </div>
                {frequency === "monthly" && parsedClientAmount.ok ? (
                  <p className="text-ink-soft mt-2 text-sm">
                    {t("perMonth", {
                      amount: money(parsedClientAmount.amountCents),
                    })}
                  </p>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                className="text-teal focus-visible:outline-teal mt-4 rounded-md text-start text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => {
                  setSelected("custom");
                  setError("");
                  setInvalidField("");
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
          <fieldset disabled={busy} className="space-y-4">
            <legend className="text-sm font-semibold">
              {t("donorDetails")}
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="donation-first-name"
                  className="text-sm font-semibold"
                >
                  {t("firstName")}
                </label>
                <input
                  ref={firstNameInput}
                  id="donation-first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  maxLength={DONATION_NAME_MAX}
                  required
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setError("");
                    setInvalidField("");
                  }}
                  aria-invalid={invalidField === "firstName"}
                  aria-describedby={
                    invalidField === "firstName" ? "donation-error" : undefined
                  }
                  className={cn(
                    fieldClass,
                    "mt-2",
                    invalidField === "firstName"
                      ? "border-orange-400"
                      : "border-orange",
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="donation-last-name"
                  className="text-sm font-semibold"
                >
                  {t("lastName")}
                </label>
                <input
                  ref={lastNameInput}
                  id="donation-last-name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  maxLength={DONATION_NAME_MAX}
                  required
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    setError("");
                    setInvalidField("");
                  }}
                  aria-invalid={invalidField === "lastName"}
                  aria-describedby={
                    invalidField === "lastName" ? "donation-error" : undefined
                  }
                  className={cn(
                    fieldClass,
                    "mt-2",
                    invalidField === "lastName"
                      ? "border-orange-400"
                      : "border-orange",
                  )}
                />
              </div>
            </div>
            <div>
              <label htmlFor="donation-email" className="text-sm font-semibold">
                {t("email")}
              </label>
              <input
                ref={emailInput}
                id="donation-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={DONATION_EMAIL_MAX}
                required
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setInvalidField("");
                }}
                aria-invalid={invalidField === "email"}
                aria-describedby={
                  invalidField === "email"
                    ? "donation-email-hint donation-error"
                    : "donation-email-hint"
                }
                className={cn(
                  fieldClass,
                  "mt-2",
                  invalidField === "email"
                    ? "border-orange-400"
                    : "border-orange",
                )}
              />
              <p
                id="donation-email-hint"
                className="text-ink-soft mt-2 text-sm"
              >
                {t("emailHint")}
              </p>
            </div>
          </fieldset>
          <fieldset disabled={busy}>
            <legend className="text-sm font-semibold">
              {t("visibilityLabel")}
            </legend>
            <div className="mt-2 space-y-2">
              {(
                [
                  ["anonymous", "visibilityAnonymous"],
                  ["public", "visibilityPublic"],
                ] as const
              ).map(([value, labelKey]) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm",
                    visibility === value
                      ? "border-orange bg-orange-50"
                      : "border-border bg-surface",
                  )}
                >
                  <input
                    type="radio"
                    name="donation-visibility"
                    value={value}
                    checked={visibility === value}
                    onChange={() => {
                      setVisibility(value);
                      setError("");
                    }}
                    className="accent-orange mt-0.5 size-4 shrink-0"
                  />
                  <span className="font-semibold">{t(labelKey)}</span>
                </label>
              ))}
            </div>
            <p className="text-ink-soft mt-3 text-sm">{t("visibilityHint")}</p>
          </fieldset>
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm",
              coverCosts
                ? "border-orange bg-orange-50"
                : "border-border bg-surface",
            )}
          >
            <input
              type="checkbox"
              name="cover-processing-costs"
              checked={coverCosts}
              disabled={busy}
              onChange={(event) => {
                setCoverCosts(event.target.checked);
                setError("");
              }}
              className="accent-orange mt-0.5 size-4 shrink-0"
            />
            <span>
              <span className="font-semibold">{t("coverCosts")}</span>
              <span className="text-ink-soft mt-1 block text-sm font-normal">
                {t("coverCostsHint")}
              </span>
            </span>
          </label>
          {coverCosts && parsedClientAmount.ok
            ? (() => {
                const estimate = processingContributionCents(
                  parsedClientAmount.amountCents,
                  { bps: feeBps, fixedCents: feeFixed },
                );
                if (!estimate.ok) return null;
                return (
                  <p className="text-ink-soft text-sm">
                    {frequency === "monthly"
                      ? t("estimateMonthly", {
                          donation: money(estimate.donationCents),
                          contribution: money(estimate.contributionCents),
                          total: money(estimate.totalCents),
                        })
                      : t("estimateOneTime", {
                          donation: money(estimate.donationCents),
                          contribution: money(estimate.contributionCents),
                          total: money(estimate.totalCents),
                        })}
                  </p>
                );
              })()
            : null}
          {turnstileSiteKey ? (
            <TurnstileField
              siteKey={turnstileSiteKey}
              resetSignal={turnstileReset}
              onToken={(token) =>
                setTurnstile((current) =>
                  applyTurnstileCallback(current, token),
                )
              }
            />
          ) : null}
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
            disabled={submitDisabled}
            className="w-full whitespace-normal"
            size="lg"
          >
            {busy
              ? t("loading")
              : frequency === "monthly"
                ? t("continueMonthly")
                : t("continue")}
          </Button>
          <p role="status" aria-live="polite" className="sr-only">
            {busy
              ? t("loading")
              : turnstileReady
                ? ""
                : t("securityCheckPending")}
          </p>
          <DonationTrust />
        </form>
      )}
    </Card>
  );
}
