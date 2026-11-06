"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { getTranslations } from "next-intl/server";
import { trustedClientIp } from "@/lib/donazioni/client-ip";
import {
  DONATION_SESSION_SECRET_MIN,
  donationSessionSecret,
  hasCloudflareDummyTurnstileCredentials,
  isProductionDeployment,
  turnstileSecretKey,
  turnstileSiteKey,
  upstashConfigured,
} from "@/lib/donazioni/config";
import { verifyTurnstileToken } from "@/lib/donazioni/turnstile";
import { controllaLimiteContatti } from "@/lib/contatti/rate-limit";
import {
  CONTACT_TURNSTILE_ACTION,
  CONTACT_TURNSTILE_FIELD,
  contactFromAddress,
  pulisciNome,
  validaContatto,
} from "@/lib/contatti/guard";

/**
 * Segreto per la chiave HMAC del limite invii: CONTACT_RATE_LIMIT_SECRET se
 * abbastanza lungo, altrimenti lo stesso segreto delle donazioni.
 */
function contactRateLimitSecret(): string | null {
  const dedicato = process.env.CONTACT_RATE_LIMIT_SECRET?.trim() ?? "";
  if (dedicato.length >= DONATION_SESSION_SECRET_MIN) return dedicato;
  return donationSessionSecret();
}

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"nome" | "email" | "messaggio", string>>;
};

/**
 * Server Action del form contatti.
 *  1. honeypot ("azienda"): se compilato, finge successo e scarta
 *  2. validazione server con limiti di lunghezza (lib/contatti/guard)
 *  3. limite invii per IP (Upstash) — obbligatorio in produzione
 *  4. Turnstile (azione "contact_form") — obbligatorio in produzione
 *  5. invio via Resend da un mittente su dominio verificato
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const t = await getTranslations("contatti.form");

  // Honeypot: i bot compilano questo campo nascosto.
  if (String(formData.get("azienda") ?? "").trim()) {
    return { status: "success", message: t("messaggioInviatoBreve") };
  }

  const nome = pulisciNome(String(formData.get("nome") ?? ""));
  const email = String(formData.get("email") ?? "").trim();
  const messaggio = String(formData.get("messaggio") ?? "").trim();

  const fieldErrors = validaContatto({ nome, email, messaggio });
  if (Object.keys(fieldErrors).length > 0) {
    const errors: ContactState["errors"] = {};
    for (const [campo, chiave] of Object.entries(fieldErrors)) {
      errors[campo as keyof typeof fieldErrors] = t(chiave);
    }
    return { status: "error", message: t("erroreGenerico"), errors };
  }

  const production = isProductionDeployment();
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_FORM_TO;
  const from = contactFromAddress(
    {
      CONTACT_FORM_FROM: process.env.CONTACT_FORM_FROM,
      DONATION_EMAIL_FROM: process.env.DONATION_EMAIL_FROM,
    },
    production,
  );

  if (!apiKey || !to || !from) {
    return { status: "error", message: t("providerNonConfigurato") };
  }

  const ip = trustedClientIp(await headers());

  // Max 3 invii ogni 20 minuti per connessione (lib/contatti/rate-limit).
  const limite = await controllaLimiteContatti(ip, {
    configured: upstashConfigured(),
    // Stesso segreto delle donazioni, salvo un segreto dedicato.
    secret: contactRateLimitSecret(),
    production,
  });
  if (limite === "limite") {
    return { status: "error", message: t("erroreTroppiInvii") };
  }
  if (limite === "nonDisponibile") {
    return { status: "error", message: t("erroreInvio") };
  }

  const secret = turnstileSecretKey();
  if (production && hasCloudflareDummyTurnstileCredentials()) {
    // Chiavi di prova Cloudflare (passano sempre): mai in produzione.
    return { status: "error", message: t("erroreInvio") };
  }
  if (secret && turnstileSiteKey()) {
    const verifica = await verifyTurnstileToken({
      secret,
      token: formData.get(CONTACT_TURNSTILE_FIELD),
      ip,
      expectedAction: CONTACT_TURNSTILE_ACTION,
    });
    if (!verifica.ok) {
      return { status: "error", message: t("erroreVerifica") };
    }
  } else if (production) {
    // Produzione senza Turnstile configurato: niente invio non protetto.
    return { status: "error", message: t("erroreInvio") };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Nuovo messaggio dal sito - ${nome}`,
      text: `Nome: ${nome}\nEmail: ${email}\n\n${messaggio}`,
    });
    if (error) throw new Error(error.message);

    return { status: "success", message: t("messaggioInviato") };
  } catch {
    return { status: "error", message: t("erroreInvio") };
  }
}
