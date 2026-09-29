import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ar from "@/messages/ar.json";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";
import it from "@/messages/it.json";
import { donationSecurityReady } from "@/lib/donazioni/config";
import { parseCheckoutRequest } from "@/lib/donazioni/validation";
import {
  BREVO_DOI_ENDPOINT,
  DONATION_NEWSLETTER_DOI_RUNTIME_ENABLED,
  NEWSLETTER_CONFIRM_ROUTE,
  isBrevoDoiReady,
  isDonationNewsletterDoiRuntimeEnabled,
  parseBrevoRedirectUrl,
  parsePositiveInt,
  readBrevoDoiConfig,
} from "./config";
import { buildBrevoDoubleOptInRequest } from "./doi-request";
import {
  metadataHasNewsletterConsent,
  shouldRequestNewsletterDoi,
} from "./doi-eligibility";

const HERE = dirname(fileURLToPath(import.meta.url));

const CONFIRM = {
  it: it.newsletter,
  en: en.newsletter,
  ar: ar.newsletter,
  bn: bn.newsletter,
} as const;

test("Brevo DOI runtime stays disabled until setup is complete", () => {
  assert.equal(DONATION_NEWSLETTER_DOI_RUNTIME_ENABLED, false);
  assert.equal(isDonationNewsletterDoiRuntimeEnabled(), false);
});

test("missing Brevo config cannot break donation checkout parsing", () => {
  assert.equal(isBrevoDoiReady({}), false);
  assert.equal(readBrevoDoiConfig({}), null);
  const parsed = parseCheckoutRequest({
    amount: "25",
    locale: "it",
    frequency: "monthly",
    firstName: "Sara",
    lastName: "Rossi",
    email: "sara@example.com",
    visibility: "anonymous",
    newsletterConsent: false,
    turnstileToken: "token",
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.amountCents, 2500);
    assert.equal(parsed.value.newsletterConsent, false);
  }

  const previousKey = process.env.BREVO_API_KEY;
  const before = donationSecurityReady();
  delete process.env.BREVO_API_KEY;
  assert.equal(donationSecurityReady(), before);
  if (previousKey === undefined) delete process.env.BREVO_API_KEY;
  else process.env.BREVO_API_KEY = previousKey;
});

test("Brevo DOI config requires api key, list, template, and redirect", () => {
  assert.equal(parsePositiveInt("3"), 3);
  assert.equal(parsePositiveInt("0"), null);
  assert.equal(parsePositiveInt("TRUE"), null);
  assert.equal(
    parseBrevoRedirectUrl("https://www.cir-roma.it/newsletter/confermata")
      ?.pathname,
    "/newsletter/confermata",
  );
  assert.equal(parseBrevoRedirectUrl("not-a-url"), null);
  assert.equal(
    isBrevoDoiReady({
      BREVO_API_KEY: "x",
      BREVO_NEWSLETTER_LIST_ID: "3",
      BREVO_DOI_TEMPLATE_ID: "",
      BREVO_DOI_REDIRECT_URL: "https://www.cir-roma.it/newsletter/confermata",
    }),
    false,
  );
  assert.equal(
    isBrevoDoiReady({
      BREVO_API_KEY: "x",
      BREVO_NEWSLETTER_LIST_ID: "3",
      BREVO_DOI_TEMPLATE_ID: "12",
      BREVO_DOI_REDIRECT_URL: "https://www.cir-roma.it/newsletter/confermata",
    }),
    true,
  );
});

test("Brevo request uses double opt-in only, never single opt-in", () => {
  const request = buildBrevoDoubleOptInRequest(
    {
      apiKey: "test-key",
      listId: 3,
      templateId: 12,
      redirectUrl: "https://www.cir-roma.it/newsletter/confermata",
    },
    {
      email: "sara@example.com",
      firstName: "Sara",
      lastName: "Rossi",
      locale: "it",
    },
  );
  assert.equal(request.url, BREVO_DOI_ENDPOINT);
  assert.match(request.url, /doubleOptinConfirmation$/);
  assert.doesNotMatch(request.url, /\/v3\/contacts$/);
  assert.equal(request.method, "POST");
  assert.deepEqual(request.body.includeListIds, [3]);
  assert.equal(request.body.templateId, 12);
  assert.equal(request.body.attributes.FIRSTNAME, "Sara");
  assert.equal(request.body.attributes.LASTNAME, "Rossi");
  assert.ok(!("updateEnabled" in request.body));
});

test("DOI eligibility: consent + verified success only", () => {
  assert.equal(
    metadataHasNewsletterConsent({ newsletter_consent: "true" }),
    true,
  );
  assert.equal(
    metadataHasNewsletterConsent({ newsletter_consent: "false" }),
    false,
  );

  assert.equal(
    shouldRequestNewsletterDoi({
      newsletterEnabled: false,
      consented: true,
      eventType: "checkout.session.completed",
      paymentStatus: "paid",
    }),
    false,
  );
  assert.equal(
    shouldRequestNewsletterDoi({
      newsletterEnabled: true,
      consented: false,
      eventType: "checkout.session.completed",
      paymentStatus: "paid",
    }),
    false,
  );
  assert.equal(
    shouldRequestNewsletterDoi({
      newsletterEnabled: true,
      consented: true,
      eventType: "checkout.session.completed",
      paymentStatus: "unpaid",
    }),
    false,
  );
  assert.equal(
    shouldRequestNewsletterDoi({
      newsletterEnabled: true,
      consented: true,
      eventType: "checkout.session.completed",
      paymentStatus: "paid",
    }),
    true,
  );
  assert.equal(
    shouldRequestNewsletterDoi({
      newsletterEnabled: true,
      consented: true,
      eventType: "checkout.session.async_payment_succeeded",
      paymentStatus: "paid",
    }),
    true,
  );
  assert.equal(
    shouldRequestNewsletterDoi({
      newsletterEnabled: true,
      consented: true,
      eventType: "checkout.session.async_payment_failed",
      paymentStatus: "unpaid",
    }),
    false,
  );
  assert.equal(
    shouldRequestNewsletterDoi({
      newsletterEnabled: true,
      consented: true,
      eventType: "invoice.paid",
      paymentStatus: "paid",
    }),
    false,
  );
});

test("webhook still does not invoke Brevo or marketing", () => {
  const source = readFileSync(
    join(HERE, "..", "donazioni", "webhook.ts"),
    "utf8",
  );
  assert.doesNotMatch(source, /brevo|requestNewsletterDoubleOptIn/i);
  assert.match(source, /sendDonationThankYouEmail/);
});

test("newsletter confirmation page copy is localized and secret-free", () => {
  assert.equal(NEWSLETTER_CONFIRM_ROUTE, "/newsletter/confermata");
  assert.equal(CONFIRM.it.confirmedTitle, "Iscrizione confermata");
  assert.match(CONFIRM.it.confirmedBody, /Comunità Islamica di Roma/);
  assert.equal(CONFIRM.it.confirmedCta, "Torna alla home");
  assert.match(CONFIRM.en.confirmedTitle, /confirmed/i);
  assert.match(CONFIRM.ar.confirmedTitle, /تأكيد/);
  assert.match(CONFIRM.bn.confirmedTitle, /নিশ্চিত/);
  for (const [locale, copy] of Object.entries(CONFIRM)) {
    const blob = `${copy.confirmedTitle} ${copy.confirmedBody} ${copy.confirmedCta}`;
    assert.doesNotMatch(blob, /\[(EN|AR|BN|IT)\]/, locale);
    assert.doesNotMatch(
      blob,
      /brevo|api[-_]?key|xkeysib|list id|template/i,
      locale,
    );
    assert.doesNotMatch(blob, /\{email\}|\{token\}|session_id/i, locale);
  }

  const page = readFileSync(
    join(
      HERE,
      "..",
      "..",
      "app",
      "[locale]",
      "(site)",
      "newsletter",
      "confermata",
      "page.tsx",
    ),
    "utf8",
  );
  assert.doesNotMatch(page, /searchParams/);
  assert.doesNotMatch(page, /BREVO_|apiKey|xkeysib/);
});
