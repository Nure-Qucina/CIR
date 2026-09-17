import { routing, isRtl, type Locale } from "@/i18n/routing";
import ar from "@/messages/ar.json";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";
import it from "@/messages/it.json";
import {
  DONATION_CURRENCY,
  getPublicSiteUrl,
  parseCustomerPortalLoginUrl,
  type DonationFrequency,
} from "./config";

export const DONATION_EMAIL_DISPLAY_NAME = "Comunità Islamica di Roma";
const DEV_FROM_ADDRESS = "onboarding@resend.dev";
const LOGO_PATH = "/LogoCirNeroIcon.png";

const EMAIL_COPY = {
  it: it.donazioni.donationEmail,
  en: en.donazioni.donationEmail,
  ar: ar.donazioni.donationEmail,
  bn: bn.donazioni.donationEmail,
} as const;

type EmailCopy = (typeof EMAIL_COPY)[Locale];

const INTL_LOCALE: Record<Locale, string> = {
  it: "it-IT",
  en: "en-GB",
  ar: "ar",
  bn: "bn",
};

const CREAM = "#f8efe3";
const CREAM_50 = "#fdfaf5";
const CREAM_DARK = "#efe2cf";
const ORANGE = "#ec8b36";
const TEAL = "#5f746e";
const INK = "#2a1f0e";
const INK_SOFT = "#5a4f3e";
const WHITE = "#ffffff";

export type DonationThankYouRenderInput = {
  firstName: string;
  donationCents: number;
  contributionCents: number;
  totalCents: number;
  locale: string;
  frequency: DonationFrequency;
  portalUrl?: string | null;
};

export type DonationThankYouRendered = {
  locale: Locale;
  subject: string;
  preheader: string;
  html: string;
  text: string;
};

export function resolveDonationEmailLocale(locale: string): Locale {
  return routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.defaultLocale;
}

export function formatDonationFromAddress(
  configured = process.env.DONATION_EMAIL_FROM,
): string {
  const raw = configured?.trim() ?? "";
  if (!raw) return `${DONATION_EMAIL_DISPLAY_NAME} <${DEV_FROM_ADDRESS}>`;
  const angled = raw.match(/^(.*)<([^<>]+)>\s*$/);
  if (angled) {
    const email = angled[2].trim();
    if (email.includes("@")) {
      return `${DONATION_EMAIL_DISPLAY_NAME} <${email}>`;
    }
  }
  if (raw.includes("@") && !raw.includes("<") && !raw.includes(">")) {
    return `${DONATION_EMAIL_DISPLAY_NAME} <${raw}>`;
  }
  return raw;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizePlainText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export function formatDonationEur(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: DONATION_CURRENCY,
  }).format(cents / 100);
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? "");
}

function withPeriodSuffix(amount: string, suffix: string): string {
  return suffix ? `${amount} ${suffix}` : amount;
}

function logoAbsoluteUrl(): string | null {
  const site = getPublicSiteUrl();
  if (!site || site.protocol !== "https:") return null;
  return `${site.origin}${LOGO_PATH}`;
}

function paragraphHtml(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${INK_SOFT};">${text}</p>`;
}

function summaryRow(
  label: string,
  value: string,
  emphasis: "normal" | "total" = "normal",
): string {
  if (emphasis === "total") {
    return `<tr>
    <td style="padding:12px 0 8px;border-top:1px solid ${CREAM_DARK};font-size:14px;line-height:1.5;color:${INK};font-weight:700;">${label}</td>
    <td style="padding:12px 0 8px;border-top:1px solid ${CREAM_DARK};font-size:14px;line-height:1.5;color:${INK};font-weight:700;white-space:nowrap;">${value}</td>
  </tr>`;
  }
  return `<tr>
    <td style="padding:8px 0;font-size:14px;line-height:1.5;color:${INK_SOFT};">${label}</td>
    <td style="padding:8px 0;font-size:14px;line-height:1.5;color:${INK};font-weight:600;white-space:nowrap;">${value}</td>
  </tr>`;
}

function ctaButton(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
    <tr>
      <td bgcolor="${ORANGE}" style="background-color:${ORANGE};border-radius:8px;">
        <a href="${safeHref}" style="display:inline-block;padding:12px 22px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;line-height:1.3;color:${INK};background-color:${ORANGE};text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;
}

export function renderDonationThankYouEmail(
  input: DonationThankYouRenderInput,
): DonationThankYouRendered {
  const locale = resolveDonationEmailLocale(input.locale);
  const copy: EmailCopy = EMAIL_COPY[locale];
  const dir = isRtl(locale) ? "rtl" : "ltr";
  const align = isRtl(locale) ? "right" : "left";
  const monthly = input.frequency === "monthly";
  const showContribution =
    Number.isInteger(input.contributionCents) && input.contributionCents > 0;
  const period = monthly ? copy.perMonth : "";
  const firstNamePlain = sanitizePlainText(input.firstName);
  const firstNameHtml = escapeHtml(firstNamePlain);
  const donation = formatDonationEur(input.donationCents, locale);
  const contribution = formatDonationEur(input.contributionCents, locale);
  const total = formatDonationEur(input.totalCents, locale);
  const donationLabeled = withPeriodSuffix(donation, period);
  const contributionLabeled = withPeriodSuffix(contribution, period);
  const totalLabeled = withPeriodSuffix(total, period);
  const portal = monthly
    ? parseCustomerPortalLoginUrl(input.portalUrl ?? null)
    : null;

  const subject = monthly ? copy.monthlySubject : copy.oneTimeSubject;
  const preheader = monthly ? copy.monthlyPreheader : copy.oneTimePreheader;
  const heading = monthly ? copy.monthlyHeading : copy.oneTimeHeading;
  const vars = { name: firstNamePlain, amount: donationLabeled };
  const htmlVars = { name: firstNameHtml, amount: escapeHtml(donationLabeled) };

  const bodyPlain = monthly
    ? [
        interpolate(copy.greeting, vars),
        "",
        interpolate(copy.monthlyIntro, vars),
        interpolate(copy.monthlyReceived, vars),
        copy.monthlyBody1,
        copy.monthlyBody2,
      ]
    : [
        interpolate(copy.greeting, vars),
        "",
        interpolate(copy.oneTimeIntro, vars),
        interpolate(copy.oneTimeReceived, vars),
        copy.oneTimeBody1,
        copy.oneTimeBody2,
      ];

  const bodyHtml = monthly
    ? [
        interpolate(copy.greeting, htmlVars),
        interpolate(copy.monthlyIntro, htmlVars),
        interpolate(copy.monthlyReceived, htmlVars),
        copy.monthlyBody1,
        copy.monthlyBody2,
      ]
        .map(paragraphHtml)
        .join("")
    : [
        interpolate(copy.greeting, htmlVars),
        interpolate(copy.oneTimeIntro, htmlVars),
        interpolate(copy.oneTimeReceived, htmlVars),
        copy.oneTimeBody1,
        copy.oneTimeBody2,
      ]
        .map(paragraphHtml)
        .join("");

  const summaryRows = [
    summaryRow(escapeHtml(copy.summaryDonation), escapeHtml(donationLabeled)),
    ...(showContribution
      ? [
          summaryRow(
            escapeHtml(copy.summaryContribution),
            escapeHtml(contributionLabeled),
          ),
        ]
      : []),
    summaryRow(
      escapeHtml(copy.summaryTotal),
      escapeHtml(totalLabeled),
      "total",
    ),
    summaryRow(
      escapeHtml(copy.summaryType),
      escapeHtml(monthly ? copy.typeMonthly : copy.typeOneTime),
    ),
    summaryRow(
      escapeHtml(copy.summaryStatus),
      escapeHtml(monthly ? copy.statusActive : copy.statusReceived),
    ),
  ].join("");

  const summaryPlain = [
    copy.summaryTitle,
    `${copy.summaryDonation}: ${donationLabeled}`,
    ...(showContribution
      ? [`${copy.summaryContribution}: ${contributionLabeled}`]
      : []),
    `${copy.summaryTotal}: ${totalLabeled}`,
    `${copy.summaryType}: ${monthly ? copy.typeMonthly : copy.typeOneTime}`,
    `${copy.summaryStatus}: ${monthly ? copy.statusActive : copy.statusReceived}`,
  ].join("\n");

  const closing = monthly ? copy.closingMonthly : copy.closingOneTime;
  const managePlain = monthly
    ? portal
      ? `${copy.manageIntro}\n${copy.manageCta}: ${portal.toString()}`
      : copy.manageIntro
    : "";
  const manageHtml = monthly
    ? `${paragraphHtml(escapeHtml(copy.manageIntro))}${
        portal ? ctaButton(portal.toString(), escapeHtml(copy.manageCta)) : ""
      }`
    : "";

  const logo = logoAbsoluteUrl();
  const logoHtml = logo
    ? `<img src="${escapeHtml(logo)}" alt="${escapeHtml(copy.orgName)}" width="160" style="display:block;width:160px;max-width:100%;height:auto;border:0;margin:0 0 12px;" />`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${CREAM};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${CREAM};">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${CREAM};">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:${WHITE};border:1px solid ${CREAM_DARK};">
        <tr>
          <td style="height:6px;background-color:${TEAL};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td dir="${dir}" style="padding:28px 32px 8px;text-align:${align};font-family:Georgia,'Times New Roman',serif;">
            ${logoHtml}
            <p style="margin:0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${TEAL};">${escapeHtml(copy.orgName)}</p>
            <h1 style="margin:12px 0 20px;font-size:26px;line-height:1.3;color:${INK};font-weight:700;">${escapeHtml(heading)}</h1>
            ${bodyHtml}
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;background-color:${CREAM_50};border:1px solid ${CREAM_DARK};">
              <tr>
                <td dir="${dir}" style="padding:18px 20px;text-align:${align};">
                  <p style="margin:0 0 12px;font-size:15px;font-weight:700;color:${INK};">${escapeHtml(copy.summaryTitle)}</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${summaryRows}</table>
                </td>
              </tr>
            </table>
            ${manageHtml}
            ${paragraphHtml(escapeHtml(closing))}
            <p style="margin:0 0 4px;font-size:16px;line-height:1.6;color:${INK_SOFT};">${escapeHtml(copy.gratitude)}</p>
            <p style="margin:0;font-size:16px;line-height:1.6;color:${INK};font-weight:700;">${escapeHtml(copy.signoff)}</p>
          </td>
        </tr>
        <tr>
          <td dir="${dir}" style="padding:18px 32px 28px;text-align:${align};font-family:Georgia,'Times New Roman',serif;border-top:1px solid ${CREAM_DARK};">
            <p style="margin:0;font-size:13px;line-height:1.5;color:${INK_SOFT};">${escapeHtml(copy.footer)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    ...bodyPlain,
    "",
    summaryPlain,
    ...(managePlain ? ["", managePlain] : []),
    "",
    closing,
    copy.gratitude,
    copy.signoff,
    "",
    copy.footer,
  ].join("\n");

  return { locale, subject, preheader, html, text };
}
