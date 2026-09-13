"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DONATION_CURRENCY, DONATION_ROUTE } from "@/lib/donazioni/config";

type DonationState = "paid" | "pending" | "unpaid";
type View = "loading" | DonationState | "invalid" | "error";

type StatusOk = { state: DonationState; amount: number; currency: string };

function readSessionId(): string | null {
  const ids = new URLSearchParams(window.location.search).getAll("session_id");
  if (ids.length !== 1) return null;
  const sessionId = ids[0]?.trim() ?? "";
  return sessionId || null;
}

function isStatusOk(data: unknown): data is StatusOk {
  if (!data || typeof data !== "object") return false;
  const { state, amount, currency } = data as Record<string, unknown>;
  return (
    (state === "paid" || state === "pending" || state === "unpaid") &&
    typeof amount === "number" &&
    Number.isInteger(amount) &&
    amount >= 0 &&
    currency === DONATION_CURRENCY
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

  useEffect(() => {
    if (!sessionId) return;

    const abort = new AbortController();
    const params = new URLSearchParams({ session_id: sessionId });
    fetch(`/api/donazioni/status?${params}`, {
      method: "GET",
      cache: "no-store",
      signal: abort.signal,
    })
      .then(async (response) => {
        if (response.status === 400 || response.status === 404) {
          setView("invalid");
          return;
        }
        if (!response.ok) {
          setView("error");
          return;
        }
        const data: unknown = await response.json();
        if (!isStatusOk(data)) {
          setView("error");
          return;
        }
        setAmount(data.amount);
        setView(data.state);
      })
      .catch(() => {
        if (!abort.signal.aborted) setView("error");
      });

    return () => abort.abort();
  }, [sessionId]);

  const money =
    amount !== null
      ? format.number(amount / 100, {
          style: "currency",
          currency: DONATION_CURRENCY,
        })
      : "";

  if (!mounted) {
    return (
      <p role="status" aria-live="polite">
        {t("resultVerifying")}
      </p>
    );
  }

  if (!sessionId) {
    return (
      <div className="space-y-6" role="alert" aria-live="assertive">
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <AlertCircle
            className="mt-0.5 shrink-0 text-orange-800"
            aria-hidden
          />
          <p className="text-ink">{t("resultInvalid")}</p>
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

  if (view === "loading") {
    return (
      <p role="status" aria-live="polite">
        {t("resultVerifying")}
      </p>
    );
  }

  if (view === "paid") {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <div className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-5">
          <CheckCircle2 className="text-teal mt-0.5 shrink-0" aria-hidden />
          <div className="space-y-2">
            <p className="text-ink font-semibold">{t("resultPaid")}</p>
            <p className="text-ink">
              {t("resultPaidAmount", { amount: money })}
            </p>
            <p className="text-ink-soft text-sm">{t("resultPaidNote")}</p>
          </div>
        </div>
        <Button href="/" variant="ghost">
          {t("backHome")}
        </Button>
      </div>
    );
  }

  if (view === "pending") {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <Clock className="mt-0.5 shrink-0 text-orange-800" aria-hidden />
          <p className="text-ink">{t("resultProcessing")}</p>
        </div>
        <Button href="/" variant="ghost">
          {t("backHome")}
        </Button>
      </div>
    );
  }

  if (view === "unpaid") {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
          <AlertCircle
            className="mt-0.5 shrink-0 text-orange-800"
            aria-hidden
          />
          <p className="text-ink">{t("resultUnpaid")}</p>
        </div>
        <Button href={DONATION_ROUTE}>{t("backDonate")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="alert" aria-live="assertive">
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
