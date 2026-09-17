"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DONATION_CURRENCY,
  DONATION_ROUTE,
  type DonationFrequency,
} from "@/lib/donazioni/config";
import { DonationProgress } from "./DonationProgress";

type DonationState = "paid" | "pending" | "unpaid";
type View = "loading" | DonationState | "invalid" | "error";

type StatusOk = {
  state: DonationState;
  amount: number;
  donationAmount: number;
  contributionAmount: number;
  currency: string;
  frequency: DonationFrequency;
};

function readSessionId(): string | null {
  const ids = new URLSearchParams(window.location.search).getAll("session_id");
  if (ids.length !== 1) return null;
  const sessionId = ids[0]?.trim() ?? "";
  return sessionId || null;
}

function isStatusOk(data: unknown): data is StatusOk {
  if (!data || typeof data !== "object") return false;
  const {
    state,
    amount,
    donationAmount,
    contributionAmount,
    currency,
    frequency,
  } = data as Record<string, unknown>;
  return (
    (state === "paid" || state === "pending" || state === "unpaid") &&
    typeof amount === "number" &&
    Number.isInteger(amount) &&
    amount >= 0 &&
    typeof donationAmount === "number" &&
    Number.isInteger(donationAmount) &&
    donationAmount >= 0 &&
    typeof contributionAmount === "number" &&
    Number.isInteger(contributionAmount) &&
    contributionAmount >= 0 &&
    currency === DONATION_CURRENCY &&
    (frequency === "one_time" || frequency === "monthly")
  );
}

const subscribe = () => () => {};

export function DonationStatus() {
  const t = useTranslations("donazioni");
  const format = useFormatter();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const sessionId = mounted ? readSessionId() : null;
  const [view, setView] = useState<View>("loading");
  const [amount, setAmount] = useState<number | null>(null);
  const [donationAmount, setDonationAmount] = useState<number | null>(null);
  const [contributionAmount, setContributionAmount] = useState(0);
  const [frequency, setFrequency] = useState<DonationFrequency>("one_time");

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const abort = new AbortController();
    const params = new URLSearchParams({ session_id: sessionId });

    async function load(initial: boolean) {
      try {
        const response = await fetch(`/api/donazioni/status?${params}`, {
          method: "GET",
          cache: "no-store",
          signal: abort.signal,
        });
        if (cancelled) return "stop";
        if (response.status === 400 || response.status === 404) {
          setView("invalid");
          return "stop";
        }
        if (!response.ok) {
          if (initial) setView("error");
          return "retry";
        }
        const data: unknown = await response.json();
        if (!isStatusOk(data)) {
          if (initial) setView("error");
          return "stop";
        }
        setAmount(data.amount);
        setDonationAmount(data.donationAmount);
        setContributionAmount(data.contributionAmount);
        setFrequency(data.frequency);
        setView(data.state);
        return data.state === "pending" ? "retry" : "stop";
      } catch {
        if (!cancelled && !abort.signal.aborted && initial) setView("error");
        return "retry";
      }
    }

    let timer: number | undefined;
    void load(true).then((next) => {
      if (next !== "retry" || cancelled) return;
      timer = window.setInterval(() => {
        void load(false).then((status) => {
          if (status === "stop" && timer) window.clearInterval(timer);
        });
      }, 15000);
    });

    return () => {
      cancelled = true;
      abort.abort();
      if (timer) window.clearInterval(timer);
    };
  }, [sessionId]);

  const money = (cents: number) =>
    format.number(cents / 100, {
      style: "currency",
      currency: DONATION_CURRENCY,
    });
  const monthly = frequency === "monthly";
  const labeled = (cents: number) =>
    monthly ? `${money(cents)} ${t("resultPerMonth")}` : money(cents);

  if (!mounted) {
    return (
      <p role="status" aria-live="polite">
        {t("resultVerifying")}
      </p>
    );
  }

  if (!sessionId) {
    return (
      <div className="space-y-5" role="alert" aria-live="assertive">
        <DonationProgress current="confirm" />
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <AlertCircle
            className="mt-0.5 shrink-0 text-orange-800"
            aria-hidden
          />
          <p className="text-ink">{t("resultInvalid")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/">{t("backHome")}</Button>
          <Button href={DONATION_ROUTE} variant="ghost">
            {t("backDonate")}
          </Button>
        </div>
      </div>
    );
  }

  if (view === "loading") {
    return (
      <div className="space-y-5">
        <DonationProgress current="confirm" />
        <p role="status" aria-live="polite">
          {t("resultVerifying")}
        </p>
      </div>
    );
  }

  if (view === "paid") {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <DonationProgress current="confirm" />
        <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <CheckCircle2 className="text-teal mt-0.5 shrink-0" aria-hidden />
          <div className="space-y-2">
            <p className="text-ink text-[length:var(--text-h3)] font-bold">
              {t("resultPaid")}
            </p>
            <p className="text-ink">
              {monthly
                ? t("resultPaidMonthlyAmount", {
                    amount: labeled(amount ?? 0),
                  })
                : t("resultPaidAmount", { amount: labeled(amount ?? 0) })}
            </p>
            {donationAmount !== null ? (
              <p className="text-ink-soft text-sm">
                {t("resultPaidDonation", { amount: labeled(donationAmount) })}
              </p>
            ) : null}
            {contributionAmount > 0 ? (
              <p className="text-ink-soft text-sm">
                {t("resultPaidContribution", {
                  amount: labeled(contributionAmount),
                })}
              </p>
            ) : null}
            <p className="text-ink-soft text-sm">
              {t("resultPaidTotal", { amount: labeled(amount ?? 0) })}
            </p>
            <p className="text-ink-soft">
              {monthly ? t("resultPaidThanksMonthly") : t("resultPaidThanks")}
            </p>
            <p className="text-ink-soft text-sm">{t("resultPaidNote")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href="/">{t("backHome")}</Button>
          <Button href={DONATION_ROUTE} variant="ghost">
            {t("backDonate")}
          </Button>
        </div>
      </div>
    );
  }

  if (view === "pending") {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <DonationProgress current="confirm" />
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <Clock className="mt-0.5 shrink-0 text-orange-800" aria-hidden />
          <div className="space-y-2">
            <p className="text-ink text-[length:var(--text-h3)] font-bold">
              {t("resultPendingTitle")}
            </p>
            <p className="text-ink">{t("resultPendingBody")}</p>
            <p className="text-ink-soft">{t("resultPendingDelay")}</p>
          </div>
        </div>
        <Button href="/" variant="ghost">
          {t("backHome")}
        </Button>
      </div>
    );
  }

  if (view === "unpaid") {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <DonationProgress current="confirm" />
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <AlertCircle
            className="mt-0.5 shrink-0 text-orange-800"
            aria-hidden
          />
          <div className="space-y-2">
            <p className="text-ink text-[length:var(--text-h3)] font-bold">
              {t("resultUnpaidTitle")}
            </p>
            <p className="text-ink">{t("resultUnpaidBody")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button href={DONATION_ROUTE}>{t("backDonate")}</Button>
          <Button href="/" variant="ghost">
            {t("backHome")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" role="alert" aria-live="assertive">
      <DonationProgress current="confirm" />
      <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
        <AlertCircle className="mt-0.5 shrink-0 text-orange-800" aria-hidden />
        <p className="text-ink">
          {view === "invalid" ? t("resultInvalid") : t("resultError")}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button href={DONATION_ROUTE}>{t("backDonate")}</Button>
        <Button href="/" variant="ghost">
          {t("backHome")}
        </Button>
      </div>
    </div>
  );
}
