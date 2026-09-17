import "server-only";
import { Resend } from "resend";
import { routing, type Locale } from "@/i18n/routing";
import ar from "@/messages/ar.json";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";
import it from "@/messages/it.json";
import {
  DONATION_CURRENCY,
  getCustomerPortalLoginUrl,
  type DonationFrequency,
} from "./config";

const EMAIL_COPY = {
  it: it.donazioni.donationEmail,
  en: en.donazioni.donationEmail,
  ar: ar.donazioni.donationEmail,
  bn: bn.donazioni.donationEmail,
} as const;

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

function formatEur(cents: number, locale: Locale): string {
  const intlLocale =
    locale === "bn"
      ? "bn"
      : locale === "ar"
        ? "ar"
        : locale === "en"
          ? "en-GB"
          : "it-IT";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: DONATION_CURRENCY,
  }).format(cents / 100);
}

function donationFromAddress(): string {
  const configured = process.env.DONATION_EMAIL_FROM?.trim();
  return configured || "Sito CIR <onboarding@resend.dev>";
}

export async function sendDonationThankYouEmail(input: {
  eventId: string;
  email: string;
  firstName: string;
  donationCents: number;
  contributionCents: number;
  totalCents: number;
  locale: string;
  frequency: DonationFrequency;
}): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return "skipped";

  const locale = routing.locales.includes(input.locale as Locale)
    ? (input.locale as Locale)
    : routing.defaultLocale;
  const copy = EMAIL_COPY[locale];
  const donation = formatEur(input.donationCents, locale);
  const total = formatEur(input.totalCents, locale);
  const contribution = formatEur(input.contributionCents, locale);
  const greeting = interpolate(copy.greeting, { name: input.firstName });
  const breakdown =
    input.contributionCents > 0
      ? interpolate(copy.breakdown, {
          donation,
          contribution,
          total,
        })
      : "";

  let text: string;
  let subject: string;
  if (input.frequency === "monthly") {
    subject = copy.monthlySubject;
    const body = interpolate(copy.monthlyBody, { amount: total });
    const portalUrl = getCustomerPortalLoginUrl();
    const manage = portalUrl
      ? interpolate(copy.monthlyManage, { url: portalUrl.toString() })
      : copy.monthlyManageNoPortal;
    text = `${greeting}\n\n${body}${breakdown ? `\n${breakdown}` : ""}\n\n${manage}\n\n${copy.signoff}\n`;
  } else {
    subject = copy.oneTimeSubject;
    text = `${greeting}\n\n${interpolate(copy.oneTimeBody, { amount: total })}${breakdown ? `\n${breakdown}` : ""}\n\n${copy.signoff}\n`;
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send(
      {
        from: donationFromAddress(),
        to: input.email,
        subject,
        text,
      },
      { idempotencyKey: input.eventId },
    );
    if (error) return "failed";
    return "sent";
  } catch {
    return "failed";
  }
}
