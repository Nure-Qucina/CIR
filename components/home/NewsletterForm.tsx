"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  subscribeNewsletter,
  type NewsletterState,
} from "@/app/[locale]/(site)/newsletter/actions";
import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

const iniziale: NewsletterState = { status: "idle", message: "" };

function Invia() {
  const { pending } = useFormStatus();
  const t = useTranslations("newsletterForm");
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClassName({
        size: "lg",
        className: "shrink-0 disabled:pointer-events-none disabled:opacity-60",
      })}
    >
      {pending ? t("invioInCorso") : t("iscriviti")}
      <ArrowRight size={18} className="rtl:rotate-180" aria-hidden />
    </button>
  );
}

/** Modulo di iscrizione: email + consenso, esito nello stesso posto. */
export function NewsletterForm() {
  const [stato, azione] = useActionState(subscribeNewsletter, iniziale);
  const t = useTranslations("newsletterForm");

  if (stato.status === "success") {
    return (
      <div
        role="status"
        className="foglio mt-7 flex items-start gap-3 p-5 sm:max-w-xl"
      >
        <CheckCircle2 className="text-teal mt-0.5 shrink-0" aria-hidden />
        <div>
          <p className="text-ink font-semibold">{t("quasiFatto")}</p>
          <p className="text-ink-soft mt-1">{stato.message}</p>
        </div>
      </div>
    );
  }

  return (
    // key: dopo ogni invio React azzera il modulo; rimontandolo con i valori
    // inviati come default, email e spunta restano compilate.
    <form
      key={`${stato.email ?? ""}-${stato.consenso ?? ""}-${stato.message}`}
      action={azione}
      className="mt-7 sm:max-w-xl"
      noValidate
    >
      {/* Honeypot: nascosto agli utenti, i bot lo compilano. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 overflow-hidden"
      >
        <label>
          Sito web
          <input type="text" name="sito" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label htmlFor="newsletter-email" className="sr-only">
        {t("email")}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={stato.email}
          placeholder={t("placeholder")}
          aria-invalid={stato.campo === "email" || undefined}
          aria-describedby={
            stato.status === "error" ? "newsletter-esito" : undefined
          }
          className={cn(
            "text-ink placeholder:text-ink-300 bg-cream-50 focus-visible:outline-teal min-w-0 flex-1 rounded-full border px-5 py-3 shadow-[inset_0_1px_3px_rgb(42_31_14/0.08)] focus-visible:outline-2 focus-visible:outline-offset-2",
            stato.campo === "email" ? "border-orange-600" : "border-border",
          )}
        />
        <Invia />
      </div>

      <label className="text-ink-soft mt-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="consenso"
          required
          defaultChecked={stato.consenso}
          aria-invalid={stato.campo === "consenso" || undefined}
          className="accent-teal mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          {t.rich("consenso", {
            privacy: (chunks) => (
              <Link
                href="/privacy"
                className="font-semibold text-teal-700 underline underline-offset-2"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>

      {stato.status === "error" && (
        <p
          id="newsletter-esito"
          role="alert"
          className="mt-3 text-sm font-semibold text-orange-700"
        >
          {stato.message}
        </p>
      )}
    </form>
  );
}
