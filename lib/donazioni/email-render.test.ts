import assert from "node:assert/strict";
import test from "node:test";
import {
  DONATION_EMAIL_DISPLAY_NAME,
  escapeHtml,
  formatDonationFromAddress,
  renderDonationThankYouEmail,
  resolveDonationEmailLocale,
} from "./email-render";

const PORTAL = "https://billing.stripe.com/p/login/test_preview1";
const RELIGIOUS =
  /jaz[aā]k|du['’ʿ]a\b|assalam|as-?salam|inshallah|insha.?allah|mashallah|alhamdulillah|barakallahu|ṣallā|salam alaikum/i;
const STRIPE_IDS = /cs_test_|cus_|sub_|in_|pi_|whsec_|sk_live_|sk_test_/;

function oneTime(overrides: Record<string, unknown> = {}) {
  return renderDonationThankYouEmail({
    firstName: "Sara",
    donationCents: 2500,
    contributionCents: 0,
    totalCents: 2500,
    locale: "it",
    frequency: "one_time",
    ...overrides,
  });
}

function monthly(overrides: Record<string, unknown> = {}) {
  return renderDonationThankYouEmail({
    firstName: "Sara",
    donationCents: 2500,
    contributionCents: 0,
    totalCents: 2500,
    locale: "it",
    frequency: "monthly",
    ...overrides,
  });
}

test("email from: display name is CIR, address comes from env", () => {
  assert.equal(
    formatDonationFromAddress(""),
    `${DONATION_EMAIL_DISPLAY_NAME} <onboarding@resend.dev>`,
  );
  assert.equal(
    formatDonationFromAddress("donazioni@example.com"),
    `${DONATION_EMAIL_DISPLAY_NAME} <donazioni@example.com>`,
  );
  assert.equal(
    formatDonationFromAddress("Sito CIR <donazioni@example.com>"),
    `${DONATION_EMAIL_DISPLAY_NAME} <donazioni@example.com>`,
  );
  assert.equal(DONATION_EMAIL_DISPLAY_NAME, "Comunità Islamica di Roma");
});

test("email locale: invalid falls back to Italian", () => {
  assert.equal(resolveDonationEmailLocale("it"), "it");
  assert.equal(resolveDonationEmailLocale("en"), "en");
  assert.equal(resolveDonationEmailLocale("ar"), "ar");
  assert.equal(resolveDonationEmailLocale("bn"), "bn");
  assert.equal(resolveDonationEmailLocale("xx"), "it");
  assert.equal(resolveDonationEmailLocale(""), "it");
  const rendered = oneTime({ locale: "not-a-locale" });
  assert.equal(rendered.locale, "it");
  assert.match(rendered.subject, /Comunità Islamica di Roma/);
});

test("email one-time: subject, name, amounts, no fee row, no portal", () => {
  const rendered = oneTime({ portalUrl: PORTAL });
  assert.equal(
    rendered.subject,
    "Grazie per il tuo sostegno alla Comunità Islamica di Roma",
  );
  assert.match(rendered.text, /Ciao Sara,/);
  assert.match(rendered.html, /Ciao Sara,/);
  assert.match(rendered.text, /Donazione: 25,00\s*€/);
  assert.match(rendered.text, /Totale: 25,00\s*€/);
  assert.doesNotMatch(rendered.text, /Contributo ai costi di transazione/);
  assert.doesNotMatch(rendered.html, /Contributo ai costi di transazione/);
  assert.match(rendered.text, /Tipo: Donazione una tantum/);
  assert.match(rendered.text, /Stato: Ricevuta/);
  assert.doesNotMatch(rendered.html, /Gestisci la tua donazione mensile/);
  assert.doesNotMatch(rendered.html, /billing\.stripe\.com/);
  assert.doesNotMatch(rendered.text, /\/ mese/);
});

test("email one-time: contribution row when cents > 0", () => {
  const rendered = oneTime({
    contributionCents: 64,
    totalCents: 2564,
  });
  assert.match(rendered.text, /Donazione: 25,00\s*€/);
  assert.match(rendered.text, /Contributo ai costi di transazione: 0,64\s*€/);
  assert.match(rendered.text, /Totale: 25,64\s*€/);
  assert.doesNotMatch(rendered.text, /commissione Stripe/i);
  assert.doesNotMatch(rendered.text, /Stripe fee/i);
});

test("email monthly: wording, period suffix, portal CTA", () => {
  const withPortal = monthly({ portalUrl: PORTAL });
  assert.equal(
    withPortal.subject,
    "Grazie per il tuo sostegno mensile alla Comunità Islamica di Roma",
  );
  assert.match(withPortal.text, /\/ mese/);
  assert.match(withPortal.text, /Tipo: Donazione mensile/);
  assert.match(withPortal.text, /Stato: Attiva/);
  assert.match(
    withPortal.html,
    /href="https:\/\/billing\.stripe\.com\/p\/login\/test_preview1"/,
  );
  assert.match(withPortal.html, /Gestisci la tua donazione mensile/);
  assert.match(
    withPortal.text,
    new RegExp(PORTAL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );

  const withoutPortal = monthly({ portalUrl: null });
  assert.doesNotMatch(withoutPortal.html, /billing\.stripe\.com/);
  assert.doesNotMatch(withoutPortal.html, /href="/);
  assert.doesNotMatch(withoutPortal.html, /href=""/);
  assert.doesNotMatch(withoutPortal.html, /href="#"/);
  assert.match(withoutPortal.text, /Puoi gestire, aggiornare o annullare/);
  assert.doesNotMatch(withoutPortal.text, /https:\/\//);

  const badPortal = monthly({ portalUrl: "https://example.com/p/login/nope" });
  assert.doesNotMatch(badPortal.html, /example\.com/);
  assert.doesNotMatch(badPortal.html, /href="/);
  assert.doesNotMatch(badPortal.html, /href=""/);
  assert.doesNotMatch(badPortal.html, /href="#"/);
});

test("email monthly: contribution uses monthly wording", () => {
  const rendered = monthly({
    contributionCents: 64,
    totalCents: 2564,
    portalUrl: PORTAL,
  });
  assert.match(rendered.text, /Donazione: 25,00\s*€ \/ mese/);
  assert.match(
    rendered.text,
    /Contributo ai costi di transazione: 0,64\s*€ \/ mese/,
  );
  assert.match(rendered.text, /Totale: 25,64\s*€ \/ mese/);
});

test("email locales: it en ar bn and no religious formulas", () => {
  const locales = ["it", "en", "ar", "bn"] as const;
  for (const locale of locales) {
    const rendered = oneTime({ locale });
    assert.equal(rendered.locale, locale);
    assert.ok(rendered.subject.length > 10);
    assert.doesNotMatch(rendered.subject, /\[(EN|AR|BN|IT)\]/);
    assert.doesNotMatch(rendered.html + rendered.text, RELIGIOUS);
    if (locale === "ar") {
      assert.match(rendered.html, /dir="rtl"/);
      assert.match(rendered.html, /lang="ar"/);
    } else {
      assert.match(rendered.html, /dir="ltr"/);
    }
  }
  const en = monthly({ locale: "en", portalUrl: PORTAL });
  assert.match(en.text, /\/ month/);
  assert.match(en.html, /Manage your monthly donation/);
  assert.match(
    en.text,
    /Thank you for choosing to support the Islamic Community of Rome every month/,
  );
  assert.doesNotMatch(en.text, /the wider area/);
  const ar = monthly({ locale: "ar", portalUrl: PORTAL });
  assert.match(ar.text, /\/ شهر/);
  assert.match(ar.html, /lang="ar"/);
  assert.match(ar.html, /dir="rtl"/);
  assert.match(
    ar.html,
    /href="https:\/\/billing\.stripe\.com\/p\/login\/test_preview1"/,
  );
  assert.match(ar.html, /bgcolor="#ec8b36"/);
  const bn = monthly({ locale: "bn", portalUrl: PORTAL });
  assert.match(bn.text, /\/ মাস/);
  assert.match(
    bn.html,
    /href="https:\/\/billing\.stripe\.com\/p\/login\/test_preview1"/,
  );
});

test("email safety: donor name escaped, no Stripe ids or raw metadata", () => {
  const rendered = oneTime({
    firstName: `<script>alert(1)</script>`,
  });
  assert.match(rendered.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(rendered.html, /<script>alert\(1\)<\/script>/);
  assert.equal(escapeHtml("<x>"), "&lt;x&gt;");
  const combined = rendered.html + rendered.text;
  assert.doesNotMatch(combined, STRIPE_IDS);
  assert.doesNotMatch(combined, /base_donation_amount_cents/);
  assert.doesNotMatch(combined, /donor_last_name/);
  assert.doesNotMatch(combined, /purpose/);
});

test("email english: capitalized thank-you and natural local-community wording", () => {
  const rendered = oneTime({ locale: "en" });
  assert.match(
    rendered.text,
    /Thank you for choosing to support the Islamic Community of Rome/,
  );
  assert.doesNotMatch(rendered.text, /\nthank you for choosing/);
  assert.match(rendered.text, /the community around us/);
  assert.doesNotMatch(rendered.text, /the wider area/);
});

test("email summary: total row is emphasized without color-only cues", () => {
  const rendered = oneTime({ contributionCents: 64, totalCents: 2564 });
  assert.match(
    rendered.html,
    /border-top:1px solid #efe2cf;font-size:14px;line-height:1\.5;color:#2a1f0e;font-weight:700;">Totale/,
  );
  assert.match(rendered.html, /font-weight:700;white-space:nowrap;">25,64/);
  const monthlyRendered = monthly({
    contributionCents: 64,
    totalCents: 2564,
  });
  assert.match(monthlyRendered.html, /font-weight:700;">Totale/);
});

test("email footer is 13px", () => {
  const rendered = oneTime();
  assert.match(rendered.html, /font-size:13px;line-height:1\.5;color:#5a4f3e/);
});

test("email logo: HTTPS public origin only", () => {
  const env = process.env as Record<string, string | undefined>;
  const previous = env.NEXT_PUBLIC_SITE_URL;
  try {
    delete env.NEXT_PUBLIC_SITE_URL;
    const none = oneTime();
    assert.doesNotMatch(none.html, /<img /);
    assert.match(none.html, /Comunità Islamica di Roma/);

    env.NEXT_PUBLIC_SITE_URL = "http://localhost:3100";
    const local = oneTime();
    assert.doesNotMatch(local.html, /<img /);
    assert.match(local.html, /Comunità Islamica di Roma/);

    env.NEXT_PUBLIC_SITE_URL = "https://cir.example";
    const withLogo = oneTime();
    assert.match(
      withLogo.html,
      /src="https:\/\/cir\.example\/LogoCirNeroIcon\.png"/,
    );
    assert.match(withLogo.html, /alt="Comunità Islamica di Roma"/);
    assert.match(withLogo.html, /Comunità Islamica di Roma/);
  } finally {
    if (previous === undefined) delete env.NEXT_PUBLIC_SITE_URL;
    else env.NEXT_PUBLIC_SITE_URL = previous;
  }
});
