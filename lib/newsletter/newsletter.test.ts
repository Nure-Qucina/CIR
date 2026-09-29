import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ar from "@/messages/ar.json";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";
import it from "@/messages/it.json";
import type { NewsletterDoubleOptInInput } from "./doi-request";
import {
  requestNewsletterDoiForCheckoutSession,
  type NewsletterDoiDependencies,
  type NewsletterDoiSession,
} from "./doi-webhook";
import { donationSecurityReady } from "@/lib/donazioni/config";
import { parseCheckoutRequest } from "@/lib/donazioni/validation";
import {
  BREVO_DOI_ENDPOINT,
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

function newsletterSession(
  overrides: Partial<Omit<NewsletterDoiSession, "metadata">> & {
    metadata?: Record<string, string> | null;
  } = {},
): NewsletterDoiSession {
  const { metadata, ...session } = overrides;
  return {
    id: "cs_test_donation",
    metadata: {
      purpose: "cir_donation",
      newsletter_consent: "true",
      donor_first_name: "Sara",
      donor_last_name: "Rossi",
      locale: "it",
      ...metadata,
    },
    customer_email: "sara@example.com",
    customer_details: null,
    payment_status: "paid",
    ...session,
  };
}

function createDoiHarness(overrides: Partial<NewsletterDoiDependencies> = {}) {
  const locks = new Map<string, string>();
  const inputs: NewsletterDoubleOptInInput[] = [];
  const store = {
    async claim(sessionId: string, token: string) {
      if (locks.has(sessionId)) return false;
      locks.set(sessionId, token);
      return true;
    },
    async markSent() {},
    async release(sessionId: string, token: string) {
      if (locks.get(sessionId) === token) locks.delete(sessionId);
    },
  };
  const dependencies: NewsletterDoiDependencies = {
    newsletterEnabled: true,
    runtimeEnabled: true,
    getStore: async () => store,
    request: async (input) => {
      inputs.push(input);
      return { ok: true };
    },
    createToken: () => "test-lock-token",
    ...overrides,
  };
  return { dependencies, inputs, locks };
}

test("Brevo DOI runtime requires the exact true value", () => {
  assert.equal(isDonationNewsletterDoiRuntimeEnabled("true"), true);
  assert.equal(isDonationNewsletterDoiRuntimeEnabled("TRUE"), false);
  assert.equal(isDonationNewsletterDoiRuntimeEnabled(" true "), false);
  assert.equal(isDonationNewsletterDoiRuntimeEnabled("false"), false);
  assert.equal(isDonationNewsletterDoiRuntimeEnabled(undefined), false);
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
  assert.deepEqual(request.body.attributes, {
    NOME: "Sara",
    COGNOME: "Rossi",
  });
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

test("webhook invokes DOI only from the verified checkout success cases", () => {
  const source = readFileSync(
    join(HERE, "..", "donazioni", "webhook.ts"),
    "utf8",
  );
  assert.match(source, /sendNewsletterDoiIfEligible\(event, session\)/);
  assert.match(source, /case "checkout\.session\.completed"/);
  assert.match(source, /case "checkout\.session\.async_payment_succeeded"/);
  assert.doesNotMatch(source, /case "invoice\.paid"[\s\S]*?sendNewsletterDoi/);
  assert.match(source, /sendDonationThankYouEmail/);
});

test("DOI runtime off skips Brevo", async () => {
  const harness = createDoiHarness({ runtimeEnabled: false });
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      newsletterSession(),
      harness.dependencies,
    ),
    "newsletter_doi_skipped",
  );
  assert.equal(harness.inputs.length, 0);
});

test("newsletter feature flag off skips Brevo", async () => {
  const harness = createDoiHarness({ newsletterEnabled: false });
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      newsletterSession(),
      harness.dependencies,
    ),
    "newsletter_doi_skipped",
  );
  assert.equal(harness.inputs.length, 0);
});

test("explicit consent false skips Brevo", async () => {
  const harness = createDoiHarness();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      newsletterSession({
        metadata: { newsletter_consent: "false" },
      }),
      harness.dependencies,
    ),
    "newsletter_doi_skipped",
  );
  assert.equal(harness.inputs.length, 0);
});

test("non-CIR Checkout Session skips Brevo", async () => {
  const harness = createDoiHarness();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      newsletterSession({ metadata: { purpose: "other" } }),
      harness.dependencies,
    ),
    "newsletter_doi_skipped",
  );
  assert.equal(harness.inputs.length, 0);
});

test("paid card checkout requests DOI with verified session data", async () => {
  const harness = createDoiHarness();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      newsletterSession({
        customer_email: null,
        customer_details: { email: " sara@example.com " },
      }),
      harness.dependencies,
    ),
    "newsletter_doi_sent",
  );
  assert.deepEqual(harness.inputs, [
    {
      email: "sara@example.com",
      firstName: "Sara",
      lastName: "Rossi",
      locale: "it",
    },
  ]);
});

test("completed SEPA processing session does not request DOI", async () => {
  const harness = createDoiHarness();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      newsletterSession({ payment_status: "unpaid" }),
      harness.dependencies,
    ),
    "newsletter_doi_skipped",
  );
  assert.equal(harness.inputs.length, 0);
});

test("paid SEPA async success requests DOI", async () => {
  const harness = createDoiHarness();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.async_payment_succeeded",
      newsletterSession(),
      harness.dependencies,
    ),
    "newsletter_doi_sent",
  );
  assert.equal(harness.inputs.length, 1);
});

test("async success without paid status does not request DOI", async () => {
  const harness = createDoiHarness();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.async_payment_succeeded",
      newsletterSession({ payment_status: "unpaid" }),
      harness.dependencies,
    ),
    "newsletter_doi_skipped",
  );
  assert.equal(harness.inputs.length, 0);
});

test("async payment failure does not request DOI", async () => {
  const harness = createDoiHarness();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.async_payment_failed",
      newsletterSession(),
      harness.dependencies,
    ),
    "newsletter_doi_skipped",
  );
  assert.equal(harness.inputs.length, 0);
});

test("invoice renewal does not request DOI", async () => {
  const harness = createDoiHarness();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "invoice.paid",
      newsletterSession(),
      harness.dependencies,
    ),
    "newsletter_doi_skipped",
  );
  assert.equal(harness.inputs.length, 0);
});

test("invoice failure and subscription lifecycle events do not request DOI", async () => {
  for (const eventType of [
    "invoice.payment_failed",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ]) {
    const harness = createDoiHarness();
    assert.equal(
      await requestNewsletterDoiForCheckoutSession(
        eventType,
        newsletterSession(),
        harness.dependencies,
      ),
      "newsletter_doi_skipped",
      eventType,
    );
    assert.equal(harness.inputs.length, 0, eventType);
  }
});

test("duplicate Checkout Session requests only one DOI", async () => {
  const harness = createDoiHarness();
  const session = newsletterSession();
  const first = await requestNewsletterDoiForCheckoutSession(
    "checkout.session.completed",
    session,
    harness.dependencies,
  );
  const retry = await requestNewsletterDoiForCheckoutSession(
    "checkout.session.async_payment_succeeded",
    session,
    harness.dependencies,
  );
  assert.equal(first, "newsletter_doi_sent");
  assert.equal(retry, "newsletter_doi_skipped");
  assert.equal(harness.inputs.length, 1);
});

test("definite Brevo failure releases the lock for a Stripe retry", async () => {
  let attempts = 0;
  const harness = createDoiHarness({
    request: async () => {
      attempts += 1;
      if (attempts === 1) return { ok: false, definitelyFailed: true };
      return { ok: true };
    },
  });
  const session = newsletterSession();
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      session,
      harness.dependencies,
    ),
    "newsletter_doi_failed",
  );
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      session,
      harness.dependencies,
    ),
    "newsletter_doi_sent",
  );
  assert.equal(attempts, 2);
});

test("Brevo failure does not throw or fail the donation webhook", async () => {
  const harness = createDoiHarness({
    request: async () => {
      throw new Error("sensitive provider error");
    },
  });
  await assert.doesNotReject(
    requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      newsletterSession(),
      harness.dependencies,
    ),
  );
  assert.equal(harness.inputs.length, 0);
});

test("idempotency store failure skips Brevo without throwing", async () => {
  const harness = createDoiHarness({
    getStore: async () => {
      throw new Error("sensitive redis error");
    },
  });
  assert.equal(
    await requestNewsletterDoiForCheckoutSession(
      "checkout.session.completed",
      newsletterSession(),
      harness.dependencies,
    ),
    "newsletter_doi_failed",
  );
  assert.equal(harness.inputs.length, 0);
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
