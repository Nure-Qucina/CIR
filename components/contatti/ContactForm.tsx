"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  sendContactMessage,
  type ContactState,
} from "@/app/[locale]/(site)/contatti/actions";
import { cn } from "@/lib/utils/cn";
import { TurnstileField } from "@/components/donazioni/TurnstileField";
import {
  CONTACT_LIMITS,
  CONTACT_TURNSTILE_ACTION,
  CONTACT_TURNSTILE_FIELD,
} from "@/lib/contatti/guard";

/** Chiave pubblica Turnstile (inserita in build). Vuota = controllo spento (sviluppo). */
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

type FormState = ContactState & { invii?: number };

const initial: FormState = { status: "idle", message: "" };

function SubmitButton({ bloccato = false }: { bloccato?: boolean }) {
  const { pending } = useFormStatus();
  const t = useTranslations("contatti.form");
  return (
    <button
      type="submit"
      disabled={pending || bloccato}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-6 py-3 font-semibold text-ink transition-colors hover:bg-orange-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-60"
    >
      {pending ? t("invioInCorso") : t("inviaMessaggio")}
      <Send size={16} aria-hidden />
    </button>
  );
}

const fieldBase =
  "mt-1.5 w-full rounded-xl border bg-surface px-4 py-2.5 text-ink placeholder:text-ink-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

export function ContactForm() {
  // `invii` conta le risposte del server: il token Turnstile vale una volta
  // sola, quindi a ogni risposta (errore compreso) il widget ne chiede uno nuovo.
  const [state, formAction] = useActionState(
    async (prev: FormState, formData: FormData): Promise<FormState> => ({
      ...(await sendContactMessage(prev, formData)),
      invii: (prev.invii ?? 0) + 1,
    }),
    initial,
  );
  const t = useTranslations("contatti.form");
  const [token, setToken] = useState("");

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-6"
      >
        <CheckCircle2 className="mt-0.5 shrink-0 text-teal" aria-hidden />
        <div>
          <p className="font-semibold text-ink">{t("grazie")}</p>
          <p className="mt-1 text-ink-soft">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.status === "error" && !state.errors && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm"
        >
          <AlertCircle className="mt-0.5 shrink-0 text-orange-700" size={18} aria-hidden />
          <p className="text-ink">{state.message}</p>
        </div>
      )}

      <div>
        <label htmlFor="nome" className="text-sm font-semibold text-ink">
          {t("nomeLabel")}
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          maxLength={CONTACT_LIMITS.nomeMax}
          aria-invalid={Boolean(state.errors?.nome)}
          aria-describedby={state.errors?.nome ? "nome-err" : undefined}
          className={cn(
            fieldBase,
            state.errors?.nome ? "border-orange-400" : "border-border",
          )}
        />
        {state.errors?.nome && (
          <p id="nome-err" className="mt-1 text-sm text-orange-700">
            {state.errors.nome}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-semibold text-ink">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={CONTACT_LIMITS.emailMax}
          aria-invalid={Boolean(state.errors?.email)}
          aria-describedby={state.errors?.email ? "email-err" : undefined}
          className={cn(
            fieldBase,
            state.errors?.email ? "border-orange-400" : "border-border",
          )}
        />
        {state.errors?.email && (
          <p id="email-err" className="mt-1 text-sm text-orange-700">
            {state.errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="messaggio" className="text-sm font-semibold text-ink">
          {t("messaggioLabel")}
        </label>
        <textarea
          id="messaggio"
          name="messaggio"
          rows={6}
          maxLength={CONTACT_LIMITS.messaggioMax}
          aria-invalid={Boolean(state.errors?.messaggio)}
          aria-describedby={
            state.errors?.messaggio ? "messaggio-err" : undefined
          }
          className={cn(
            fieldBase,
            "resize-y",
            state.errors?.messaggio ? "border-orange-400" : "border-border",
          )}
        />
        {state.errors?.messaggio && (
          <p id="messaggio-err" className="mt-1 text-sm text-orange-700">
            {state.errors.messaggio}
          </p>
        )}
      </div>

      {/* Honeypot anti-spam: nascosto agli utenti, visibile ai bot. */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="azienda">{t("aziendaLabel")}</label>
        <input id="azienda" name="azienda" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {TURNSTILE_SITE_KEY ? (
        <>
          <TurnstileField
            siteKey={TURNSTILE_SITE_KEY}
            action={CONTACT_TURNSTILE_ACTION}
            onToken={setToken}
            resetSignal={state.invii ?? 0}
          />
          <input type="hidden" name={CONTACT_TURNSTILE_FIELD} value={token} />
        </>
      ) : null}

      <SubmitButton bloccato={Boolean(TURNSTILE_SITE_KEY) && !token} />

      {/* Informativa breve nel punto di raccolta (art. 13 GDPR). Niente
        casella "accetto": la base giuridica è la richiesta dell'utente,
        non il consenso. */}
      <p className="text-ink-soft text-sm">
        {t.rich("informativa", {
          privacy: (chunks) => (
            <Link
              href="/privacy"
              className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
