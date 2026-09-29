import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ar from "@/messages/ar.json";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";
import it from "@/messages/it.json";
import {
  DONATION_DEFAULT_CENTS,
  DONATION_DEFAULT_FREQUENCY,
  DONATION_DEFAULT_VISIBILITY,
  DONATION_FREQUENCY_ORDER,
  DONATION_VISIBILITY_ORDER,
  initialDonationFormState,
  isDonationNewsletterEnabled,
} from "./config";
import {
  NEWSLETTER_CONSENT_COPY_VERSION,
  NEWSLETTER_CONSENT_FIELD_NAME,
  NEWSLETTER_CONSENT_SOURCE,
  newsletterConsentFieldState,
  newsletterConsentForCheckout,
  newsletterConsentMetadata,
  shouldRenderNewsletterConsent,
} from "./consent";
import { donationMetadata } from "./metadata";
import { STATUS_ALERT, STATUS_CARD, STATUS_ICON } from "./status-ui";
import { stripeLocaleFromCir, stripeUsesFallbackLocale } from "./stripe-locale";
import { shouldSendInitialThankYou } from "./status-state";

const LOCALES = {
  it: it.donazioni,
  en: en.donazioni,
  ar: ar.donazioni,
  bn: bn.donazioni,
} as const;

test("monthly is first in UI order and is the default", () => {
  const initial = initialDonationFormState();
  assert.equal(DONATION_DEFAULT_CENTS, 1000);
  assert.deepEqual(DONATION_FREQUENCY_ORDER, ["monthly", "one_time"]);
  assert.equal(DONATION_DEFAULT_FREQUENCY, "monthly");
  assert.equal(DONATION_FREQUENCY_ORDER.includes("one_time"), true);
  assert.equal(DONATION_FREQUENCY_ORDER[1], "one_time");
  assert.equal(initial.frequency, "monthly");
  assert.deepEqual(initial.frequencyOrder, ["monthly", "one_time"]);
  assert.equal(initial.frequencyOrder.includes("one_time"), true);
});

test("DonationForm initial UI is wired to monthly-first defaults", () => {
  const source = readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "components",
      "donazioni",
      "DonationForm.tsx",
    ),
    "utf8",
  );
  assert.match(
    source,
    /useState<DonationFrequency>\(\s*DONATION_DEFAULT_FREQUENCY/,
  );
  assert.match(source, /DONATION_FREQUENCY_ORDER\.map/);
  assert.match(
    source,
    /useState<DonationVisibility>\(\s*DONATION_DEFAULT_VISIBILITY/,
  );
  assert.match(source, /DONATION_VISIBILITY_ORDER\.map/);
});

test("monthly copy makes recurrence explicit in it/en/ar/bn", () => {
  assert.match(LOCALES.it.monthlyRepeat, /ogni mese/i);
  assert.match(LOCALES.it.continueMonthly, /mensile/i);
  assert.match(LOCALES.it.payMonthly, /\/ mese/);
  assert.match(LOCALES.en.monthlyRepeat, /every month/i);
  assert.match(LOCALES.ar.monthlyRepeat, /شهر/);
  assert.match(LOCALES.bn.monthlyRepeat, /মাস/);
});

test("fee checkbox copy is gone from donor locales", () => {
  for (const copy of Object.values(LOCALES)) {
    assert.ok(!("coverCosts" in copy));
    assert.ok(!("coverCostsHint" in copy));
    assert.ok(!("estimateOneTime" in copy));
  }
});

test("status colors use distinct semantic tokens", () => {
  assert.match(STATUS_CARD.success, /status-success/);
  assert.match(STATUS_CARD.pending, /status-pending/);
  assert.match(STATUS_CARD.error, /status-error/);
  assert.match(STATUS_ICON.success, /status-success/);
  assert.match(STATUS_ICON.pending, /status-pending/);
  assert.match(STATUS_ALERT.error, /status-error/);
  assert.notEqual(STATUS_CARD.success, STATUS_CARD.error);
  assert.notEqual(STATUS_CARD.pending, STATUS_CARD.error);
});

test("Stripe locale mapping for it/en/ar/bn", () => {
  assert.equal(stripeLocaleFromCir("it"), "it");
  assert.equal(stripeLocaleFromCir("en"), "en");
  assert.equal(stripeLocaleFromCir("ar"), "ar");
  assert.equal(stripeLocaleFromCir("bn"), "en");
  assert.equal(stripeUsesFallbackLocale("it"), false);
  assert.equal(stripeUsesFallbackLocale("en"), false);
  assert.equal(stripeUsesFallbackLocale("ar"), false);
  assert.equal(stripeUsesFallbackLocale("bn"), true);
});

test("newsletter consent default false and evidence fields", () => {
  const denied = newsletterConsentMetadata({
    consent: false,
    locale: "it",
    at: new Date("2026-09-22T12:00:00.000Z"),
  });
  assert.equal(denied.newsletter_consent, "false");
  assert.equal(denied.newsletter_consent_source, NEWSLETTER_CONSENT_SOURCE);
  assert.equal(denied.newsletter_consent_copy, NEWSLETTER_CONSENT_COPY_VERSION);
  assert.equal(denied.newsletter_consent_locale, "it");
  assert.equal(denied.newsletter_consent_at, "2026-09-22T12:00:00.000Z");

  const granted = newsletterConsentMetadata({
    consent: true,
    locale: "en",
    at: new Date("2026-09-22T12:00:00.000Z"),
  });
  assert.equal(granted.newsletter_consent, "true");
});

test("newsletter consent does not change transactional thank-you eligibility", () => {
  assert.equal(
    shouldSendInitialThankYou("checkout.session.completed", "paid"),
    true,
  );
  assert.equal(
    shouldSendInitialThankYou("checkout.session.completed", "unpaid"),
    false,
  );
});

test("newsletter flag: only exact true enables the checkbox", () => {
  assert.equal(isDonationNewsletterEnabled(undefined), false);
  assert.equal(isDonationNewsletterEnabled(""), false);
  assert.equal(isDonationNewsletterEnabled("false"), false);
  assert.equal(isDonationNewsletterEnabled("1"), false);
  assert.equal(isDonationNewsletterEnabled("TRUE"), false);
  assert.equal(isDonationNewsletterEnabled(true), false);
  assert.equal(isDonationNewsletterEnabled("true"), true);
});

test("newsletter flag disabled: checkbox absent; payload is false", () => {
  assert.equal(shouldRenderNewsletterConsent(false), false);
  assert.deepEqual(newsletterConsentFieldState(false), {
    present: false,
    checked: false,
  });
  assert.equal(newsletterConsentForCheckout(false, true), false);
  assert.equal(newsletterConsentForCheckout(false, false), false);
});

test("newsletter flag enabled: checkbox present and unchecked", () => {
  assert.equal(shouldRenderNewsletterConsent(true), true);
  assert.deepEqual(newsletterConsentFieldState(true), {
    present: true,
    checked: false,
  });
  assert.equal(newsletterConsentForCheckout(true, false), false);
  assert.equal(newsletterConsentForCheckout(true, true), true);
  assert.equal(NEWSLETTER_CONSENT_FIELD_NAME, "newsletter-consent");
});

test("anonymity copy is public-visibility only", () => {
  const initial = initialDonationFormState();
  assert.equal(DONATION_DEFAULT_VISIBILITY, "anonymous");
  assert.deepEqual(DONATION_VISIBILITY_ORDER, ["anonymous", "public"]);
  assert.equal(initial.visibility, "anonymous");
  assert.equal(initial.visibilityOrder.includes("public"), true);
  assert.equal(
    LOCALES.it.visibilityAnonymous,
    "Non mostrare pubblicamente il mio nome",
  );
  assert.equal(
    LOCALES.it.visibilityPublic,
    "Mostra il mio nome pubblicamente come sostenitore",
  );
  assert.match(LOCALES.it.visibilityHint, /CIR e Stripe/);
  assert.doesNotMatch(LOCALES.it.visibilityHint, /criptografic/);
  assert.doesNotMatch(LOCALES.it.visibilityAnonymous, /anonim/i);
  assert.match(LOCALES.en.visibilityAnonymous, /publicly/i);
  for (const copy of Object.values(LOCALES)) {
    assert.match(copy.newsletterConsent, /.{20,}/);
    assert.ok(!copy.newsletterConsent.includes("[EN]"));
    assert.match(copy.visibilityAnonymous, /.{8,}/);
    assert.match(copy.visibilityPublic, /.{8,}/);
  }
});

test("new metadata has consent evidence and no fee keys", () => {
  const meta = donationMetadata({
    frequency: "monthly",
    visibility: "anonymous",
    firstName: "Sara",
    lastName: "Rossi",
    locale: "it",
    donationCents: 2500,
    newsletterConsent: false,
    consentAt: new Date("2026-09-22T12:00:00.000Z"),
  });
  assert.equal(meta.donor_visibility, "anonymous");
  const publicMeta = donationMetadata({
    frequency: "one_time",
    visibility: "public",
    firstName: "Sara",
    lastName: "Rossi",
    locale: "it",
    donationCents: 2500,
    newsletterConsent: false,
  });
  assert.equal(publicMeta.donor_visibility, "public");
  assert.equal(meta.base_donation_amount_cents, "2500");
  assert.equal(meta.total_amount_cents, "2500");
  assert.equal(meta.newsletter_consent, "false");
  assert.ok(!("cover_processing_costs" in meta));
  assert.ok(!("processing_cost_contribution_cents" in meta));
});

test("webhook does not send marketing or newsletter email", () => {
  const source = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "webhook.ts"),
    "utf8",
  );
  assert.match(source, /sendDonationThankYouEmail/);
  assert.match(source, /shouldSendInitialThankYou/);
  assert.doesNotMatch(
    source,
    /mailchimp|brevo|sendgrid|audience|marketing|newsletter/i,
  );
  assert.doesNotMatch(
    source,
    /sendMarketing|subscribeToList|addToList|Resend\.Audiences/,
  );
  assert.equal(
    (source.match(/send[A-Za-z]+Email/g) ?? []).every(
      (name) => name === "sendDonationThankYouEmail",
    ),
    true,
  );
});
