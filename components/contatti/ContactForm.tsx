"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import {
  sendContactMessage,
  type ContactState,
} from "@/app/[locale]/(site)/contatti/actions";
import { cn } from "@/lib/utils/cn";

const initial: ContactState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("contatti.form");
  return (
    <button
      type="submit"
      disabled={pending}
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
  const [state, formAction] = useActionState(sendContactMessage, initial);
  const t = useTranslations("contatti.form");

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

      <SubmitButton />
    </form>
  );
}
