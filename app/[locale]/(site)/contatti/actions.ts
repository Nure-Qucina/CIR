"use server";

import { Resend } from "resend";
import { getTranslations } from "next-intl/server";

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"nome" | "email" | "messaggio", string>>;
};

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * Server Action del form contatti.
 *  - validazione lato server
 *  - anti-spam: honeypot ("azienda") — se compilato, scarta in silenzio
 *  - invio via Resend se configurato (RESEND_API_KEY + CONTACT_FORM_TO)
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const t = await getTranslations("contatti.form");

  // Honeypot: i bot compilano questo campo nascosto.
  if ((formData.get("azienda") as string)?.trim()) {
    return { status: "success", message: t("messaggioInviatoBreve") };
  }

  const nome = (formData.get("nome") as string)?.trim() ?? "";
  const email = (formData.get("email") as string)?.trim() ?? "";
  const messaggio = (formData.get("messaggio") as string)?.trim() ?? "";

  const errors: ContactState["errors"] = {};
  if (nome.length < 2) errors.nome = t("erroreNome");
  if (!isEmail(email)) errors.email = t("erroreEmail");
  if (messaggio.length < 10) errors.messaggio = t("erroreMessaggio");

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: t("erroreGenerico"),
      errors,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_FORM_TO;

  if (!apiKey || !to) {
    // Provider non ancora configurato (chiave da inserire in .env.local).
    return {
      status: "error",
      message: t("providerNonConfigurato"),
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Sito CIR <onboarding@resend.dev>",
      to,
      replyTo: email,
      subject: `Nuovo messaggio dal sito — ${nome}`,
      text: `Nome: ${nome}\nEmail: ${email}\n\n${messaggio}`,
    });
    if (error) throw new Error(error.message);

    return {
      status: "success",
      message: t("messaggioInviato"),
    };
  } catch {
    return {
      status: "error",
      message: t("erroreInvio"),
    };
  }
}
