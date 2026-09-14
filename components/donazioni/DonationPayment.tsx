"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  CheckoutElementsProvider,
  ContactDetailsElement,
  ExpressCheckoutElement,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import type {
  Appearance,
  Stripe,
  StripeCheckoutExpressCheckoutElementOptions,
  StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
} from "@stripe/stripe-js";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { DONATION_ROUTE } from "@/lib/donazioni/config";
import { DonationTrust } from "./DonationTrust";

const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#ec8b36",
    colorBackground: "#fdfaf5",
    colorText: "#2a1f0e",
    colorTextSecondary: "#5a4f3e",
    colorDanger: "#8a4918",
    accessibleColorOnColorPrimary: "#2a1f0e",
    borderRadius: "12px",
    fontFamily: "Montserrat, Arial, sans-serif",
  },
};

const expressCheckoutOptions: StripeCheckoutExpressCheckoutElementOptions = {
  buttonHeight: 48,
  buttonTheme: undefined,
  buttonType: {
    applePay: "donate",
    googlePay: "donate",
    paypal: "paypal",
  },
  layout: { maxColumns: 2, overflow: "auto" },
  paymentMethodOrder: ["applePay", "googlePay", "paypal", "link"],
  paymentMethods: {
    applePay: "auto",
    googlePay: "auto",
    paypal: "auto",
    link: "auto",
    amazonPay: "never",
    klarna: "never",
  },
};

function preferredWalletsAvailable(
  methods:
    | StripeExpressCheckoutElementReadyEvent["availablePaymentMethods"]
    | StripeExpressCheckoutElementAvailablePaymentMethodsChangeEvent["paymentMethods"],
): boolean {
  if (!methods) return false;
  return (
    isWalletFlagOn(methods.applePay) ||
    isWalletFlagOn(methods.googlePay) ||
    isWalletFlagOn(methods.paypal) ||
    isWalletFlagOn(methods.link)
  );
}

function isWalletFlagOn(value: unknown): boolean {
  if (value === true) return true;
  return (
    typeof value === "object" &&
    value !== null &&
    "available" in value &&
    (value as { available?: unknown }).available === true
  );
}

function PaymentFields({ onBack }: { onBack: () => void }) {
  const state = useCheckoutElements();
  const t = useTranslations("donazioni");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [walletCheck, setWalletCheck] = useState<
    "checking" | "available" | "none"
  >("checking");
  const lock = useRef(false);

  async function confirmPayment(
    expressCheckoutConfirmEvent?: StripeExpressCheckoutElementConfirmEvent,
  ) {
    if (lock.current || state.type !== "success" || loadFailed) return;
    if (!expressCheckoutConfirmEvent && !state.checkout.canConfirm) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await state.checkout.confirm(
        expressCheckoutConfirmEvent
          ? { expressCheckoutConfirmEvent }
          : undefined,
      );
      if (result.type === "error") {
        setError(result.error.message || t("paymentError"));
        lock.current = false;
        setBusy(false);
      } else {
        router.replace(`${DONATION_ROUTE}/esito`);
      }
    } catch {
      setError(t("paymentError"));
      lock.current = false;
      setBusy(false);
    }
  }

  async function confirmCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await confirmPayment();
  }

  if (state.type !== "success")
    return (
      <div className="mt-6 space-y-5">
        <p
          role={state.type === "error" ? "alert" : "status"}
          aria-live={state.type === "error" ? "assertive" : "polite"}
        >
          {state.type === "error" ? t("genericError") : t("loadingPayment")}
        </p>
        <Button variant="ghost" onClick={onBack}>
          {t("changeAmount")}
        </Button>
      </div>
    );

  const displayError = loadFailed
    ? t("genericError")
    : error || state.checkout.lastPaymentError?.message || "";

  const walletsVisible = walletCheck === "available";

  return (
    <form onSubmit={confirmCard} className="mt-6 space-y-6" aria-busy={busy}>
      <p className="bg-cream-50 rounded-xl p-4 font-semibold">
        {t("total", { amount: state.checkout.total.total.amount })}
      </p>
      <div
        className={
          walletCheck === "none"
            ? "hidden"
            : walletsVisible
              ? "space-y-4"
              : "h-0 overflow-hidden"
        }
        aria-hidden={!walletsVisible}
      >
        <ExpressCheckoutElement
          options={expressCheckoutOptions}
          onConfirm={(event) => {
            void confirmPayment(event);
          }}
          onReady={(event) => {
            setWalletCheck(
              preferredWalletsAvailable(event.availablePaymentMethods)
                ? "available"
                : "none",
            );
          }}
          onAvailablePaymentMethodsChange={(event) => {
            setWalletCheck(
              preferredWalletsAvailable(event.paymentMethods)
                ? "available"
                : "none",
            );
          }}
          onLoadError={() => setWalletCheck("none")}
        />
        {walletsVisible ? (
          <p className="text-ink-soft relative text-center text-sm">
            <span
              className="bg-border absolute inset-x-0 top-1/2 h-px"
              aria-hidden
            />
            <span className="bg-surface relative px-3">{t("orPay")}</span>
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t("contactTitle")}</h3>
        <ContactDetailsElement onLoadError={() => setLoadFailed(true)} />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t("paymentMethod")}</h3>
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card"],
            wallets: {
              applePay: "never",
              googlePay: "never",
              link: "never",
            },
          }}
          onLoadError={() => setLoadFailed(true)}
        />
      </div>
      <div aria-live="assertive" aria-atomic="true">
        {displayError ? (
          <p
            role="alert"
            className="rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800"
          >
            {displayError}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        className="w-full whitespace-normal"
        size="lg"
        disabled={busy || loadFailed || !state.checkout.canConfirm}
      >
        {busy
          ? t("confirming")
          : t("pay", { amount: state.checkout.total.total.amount })}
      </Button>
      <p role="status" aria-live="polite" className="sr-only">
        {busy ? t("confirming") : ""}
      </p>
      <DonationTrust />
      <Button
        type="button"
        variant="ghost"
        className="w-full whitespace-normal"
        disabled={busy}
        onClick={onBack}
      >
        {t("changeAmount")}
      </Button>
    </form>
  );
}

export function DonationPayment({
  clientSecret,
  stripe,
  locale,
  onBack,
}: {
  clientSecret: string;
  stripe: Stripe;
  locale: Locale;
  onBack: () => void;
}) {
  const t = useTranslations("donazioni");
  return (
    <>
      {locale === "bn" && (
        <p className="text-ink-soft mt-4 text-sm">{t("stripeLanguage")}</p>
      )}
      <CheckoutElementsProvider
        stripe={stripe}
        options={{ clientSecret, elementsOptions: { appearance } }}
      >
        <PaymentFields onBack={onBack} />
      </CheckoutElementsProvider>
    </>
  );
}
