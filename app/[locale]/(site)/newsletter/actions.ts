"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  readBrevoDoiConfig,
  BREVO_DOI_TIMEOUT_MS,
} from "@/lib/newsletter/config";
import {
  buildBrevoDoubleOptInRequest,
  safeBrevoErrorDetails,
} from "@/lib/newsletter/doi-request";
import { trustedClientIp } from "@/lib/donazioni/client-ip";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
  campo?: "email" | "consenso";
  /** Valori inviati, per ricompilare il modulo dopo un errore. */
  email?: string;
  consenso?: boolean;
};

const MAX_TENTATIVI = 5;
const FINESTRA = "10 m";

function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
}

/** Limite per IP (hash, mai l'IP in chiaro). Senza Upstash configurato non limita. */
async function entroIlLimite(): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return true;
  try {
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      import("@upstash/ratelimit"),
      import("@upstash/redis"),
    ]);
    const limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(MAX_TENTATIVI, FINESTRA),
      prefix: "cir:nl:ip",
      analytics: false,
    });
    const ip = trustedClientIp(await headers());
    const hash = createHash("sha256").update(`nl:${ip}`).digest("hex");
    return (await limiter.limit(hash)).success;
  } catch {
    // Se Redis non risponde non blocchiamo l'iscrizione: Brevo fa comunque
    // la doppia conferma, quindi nessun indirizzo entra in lista senza clic.
    return true;
  }
}

/**
 * Iscrizione alla newsletter dalla home, separata dal flusso donazioni.
 * Solo double opt-in Brevo (stessa lista e stesso template delle donazioni):
 * l'indirizzo entra in lista solo dopo il clic sull'email di conferma, che
 * riporta a /newsletter/confermata.
 *  - anti-spam: honeypot ("sito") + limite di tentativi per IP
 *  - consenso all'informativa obbligatorio
 */
export async function subscribeNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const t = await getTranslations("newsletterForm");

  if ((formData.get("sito") as string)?.trim()) {
    return { status: "success", message: t("controllaEmail") };
  }

  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const consenso = formData.get("consenso") === "on";
  const inviati = { email, consenso };
  if (!isEmail(email)) {
    return {
      status: "error",
      message: t("erroreEmail"),
      campo: "email",
      ...inviati,
    };
  }
  if (!consenso) {
    return {
      status: "error",
      message: t("erroreConsenso"),
      campo: "consenso",
      ...inviati,
    };
  }

  const config = readBrevoDoiConfig();
  if (!config) {
    return { status: "error", message: t("nonDisponibile"), ...inviati };
  }
  if (!(await entroIlLimite())) {
    return { status: "error", message: t("troppiTentativi"), ...inviati };
  }

  const request = buildBrevoDoubleOptInRequest(config, { email });
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
      signal: AbortSignal.timeout(BREVO_DOI_TIMEOUT_MS),
    });
    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }
      console.warn("newsletter_form_http_error", {
        status: response.status,
        ...safeBrevoErrorDetails(body, [email]),
      });
      return { status: "error", message: t("erroreInvio"), ...inviati };
    }
    return { status: "success", message: t("controllaEmail") };
  } catch {
    return { status: "error", message: t("erroreInvio"), ...inviati };
  }
}
