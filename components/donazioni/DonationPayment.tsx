"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import {
  CheckoutElementsProvider,
  ContactDetailsElement,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout";
import type { Stripe, Appearance } from "@stripe/stripe-js";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";
import { useRouter } from "@/i18n/navigation";
import { DONATION_ROUTE } from "@/lib/donazioni/config";

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

function PaymentFields({ onBack }: { onBack: () => void }) {
  const state = useCheckoutElements();
  const t = useTranslations("donazioni");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const lock = useRef(false);

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      lock.current ||
      state.type !== "success" ||
      !state.checkout.canConfirm ||
      loadFailed
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await state.checkout.confirm();
      if (result.type === "error") {
        // Messaggio Stripe destinato al donatore, reso come testo React.
        setError(result.error.message || t("paymentError"));
        lock.current = false;
        setBusy(false);
      } else {
        // Nessuna deduzione sul pagamento: il risultato resta da verificare.
        router.replace(`${DONATION_ROUTE}/esito`);
      }
    } catch {
      setError(t("paymentError"));
      lock.current = false;
      setBusy(false);
    }
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

  return (
    <form onSubmit={confirm} className="mt-6 space-y-6" aria-busy={busy}>
      <p className="bg-cream-50 rounded-xl p-4 font-semibold">
        {t("total", { amount: state.checkout.total.total.amount })}
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t("contactTitle")}</h3>
        <ContactDetailsElement onLoadError={() => setLoadFailed(true)} />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t("paymentMethod")}</h3>
        <PaymentElement
          options={{ layout: "accordion" }}
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
      <Button
        type="button"
        variant="ghost"
        className="w-full whitespace-normal"
        disabled={busy}
        onClick={onBack}
      >
        {t("changeAmount")}
      </Button>
      <p className="text-ink-soft text-center text-sm">{t("secure")}</p>
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
