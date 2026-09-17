import assert from "node:assert/strict";
import test from "node:test";
import { normalizeIp, trustedClientIp } from "./client-ip";
import {
  CLOUDFLARE_DUMMY_PASS_SECRET,
  DONATION_CSRF_HEADER,
  DONATION_SESSION_COOKIE,
  TURNSTILE_ACTION,
  donationSecurityReady,
} from "./config";
import { authorizeDonationCheckout } from "./checkout-guard";
import { donationTotals, processingContributionCents } from "./fees";
import { isSameSiteOrigin } from "./origin";
import {
  createDonationSession,
  csrfMatches,
  parseDonationSession,
  serializeDonationCookie,
} from "./session";
import { authorizeDonationSession } from "./session-guard";
import {
  donationState,
  shouldSendInitialThankYou,
  thankYouIdempotencyKey,
} from "./status-state";
import { allowedTurnstileHostnames, verifyTurnstileToken } from "./turnstile";
import {
  applyTurnstileCallback,
  beginTurnstileReset,
  canSubmitDonationCheckout,
  emptyTurnstileClientState,
  prepareDonationCheckout,
} from "./turnstile-client";
import { shouldResetTurnstileAfterCheckout } from "./turnstile-reset";
import { parseCheckoutRequest } from "./validation";

const SECRET = "a".repeat(48);
const SITE = "http://localhost:3100";

function envBag(): Record<string, string | undefined> {
  return process.env as Record<string, string | undefined>;
}

function restoreEnv(previous: Record<string, string | undefined>) {
  const env = envBag();
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete env[key];
    else env[key] = value;
  }
}

function enableSecurityEnv() {
  const previous = {
    DONATIONS_ENABLED: process.env.DONATIONS_ENABLED,
    DONATION_SESSION_SECRET: process.env.DONATION_SESSION_SECRET,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    TURNSTILE_ALLOWED_HOSTNAMES: process.env.TURNSTILE_ALLOWED_HOSTNAMES,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };
  process.env.DONATIONS_ENABLED = "true";
  process.env.DONATION_SESSION_SECRET = SECRET;
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  process.env.TURNSTILE_SECRET_KEY = CLOUDFLARE_DUMMY_PASS_SECRET;
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
  process.env.NEXT_PUBLIC_SITE_URL = SITE;
  envBag().NODE_ENV = "test";
  delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
  delete process.env.VERCEL_ENV;
  return previous;
}

const validBody = {
  amount: "25",
  locale: "it",
  frequency: "one_time",
  firstName: "Sara",
  lastName: "Rossi",
  email: "sara@example.com",
  visibility: "anonymous",
  coverProcessingCosts: false,
  turnstileToken: "turnstile-token-ok",
};

function checkoutRequest(input: {
  origin?: string | null;
  csrf?: string;
  cookie?: string;
  body?: unknown;
  ip?: string;
}) {
  const headers = new Headers({
    "content-type": "application/json",
    "sec-fetch-site": "same-origin",
  });
  if (input.origin !== null) headers.set("origin", input.origin ?? SITE);
  if (input.csrf) headers.set(DONATION_CSRF_HEADER, input.csrf);
  if (input.cookie) headers.set("cookie", input.cookie);
  if (input.ip) headers.set("x-forwarded-for", input.ip);
  return new Request(`${SITE}/api/donazioni/checkout`, {
    method: "POST",
    headers,
    body: JSON.stringify(input.body ?? validBody),
  });
}

function sessionRequest(input: { origin?: string | null; cookie?: string }) {
  const headers = new Headers({
    "sec-fetch-site": "same-origin",
  });
  if (input.origin !== null) headers.set("origin", input.origin ?? SITE);
  if (input.cookie) headers.set("cookie", input.cookie);
  return new Request(`${SITE}/api/donazioni/session`, {
    method: "POST",
    headers,
  });
}

function siteverify(body: unknown) {
  return async () => new Response(JSON.stringify(body), { status: 200 });
}

test("fees: 25 euro gross-up is 0.64 euro contribution", () => {
  const result = processingContributionCents(2500);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.contributionCents, 64);
    assert.equal(result.totalCents, 2564);
  }
});

test("fees: checkbox false keeps donation total", () => {
  const result = donationTotals(1250, false);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.contributionCents, 0);
    assert.equal(result.totalCents, 1250);
  }
});

test("fees: monthly uses the same integer-cent formula", () => {
  const result = donationTotals(2500, true);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.contributionCents, 64);
});

test("fees: total cannot exceed donation max", () => {
  const result = donationTotals(500000, true);
  assert.equal(result.ok, false);
});

test("validation: coverProcessingCosts must be boolean", () => {
  const without = { ...validBody } as Record<string, unknown>;
  delete without.coverProcessingCosts;
  const parsed = parseCheckoutRequest(without);
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.equal(parsed.error, "invalid_cover_processing_costs");
});

test("validation: client-supplied fee amount is rejected", () => {
  const parsed = parseCheckoutRequest({
    ...validBody,
    processingCostCents: 64,
  });
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.equal(parsed.error, "invalid_request");
});

test("validation: coverProcessingCosts true is accepted without a client fee", () => {
  const parsed = parseCheckoutRequest({
    ...validBody,
    coverProcessingCosts: true,
  });
  assert.equal(parsed.ok, true);
});

test("origin: configured origin is required", () => {
  const headers = new Headers({
    origin: SITE,
    "sec-fetch-site": "same-origin",
  });
  assert.equal(isSameSiteOrigin(headers, SITE), true);
  headers.set("origin", "https://evil.example");
  assert.equal(isSameSiteOrigin(headers, SITE), false);
});

test("session: valid signed cookie round-trips", () => {
  const created = createDonationSession(SECRET, 1_000_000);
  const parsed = parseDonationSession(created.token, SECRET, 1_000_000);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.session.id, created.session.id);
    assert.equal(csrfMatches(parsed.session, created.session.csrf), true);
    assert.equal(csrfMatches(parsed.session, "nope-nope-nope-nope"), false);
  }
});

test("session: expired and invalid signatures fail", () => {
  const created = createDonationSession(SECRET, 1_000);
  const missing = parseDonationSession(undefined, SECRET, 2_000);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.reason, "missing");
  const expired = parseDonationSession(
    created.token,
    SECRET,
    created.session.exp + 1,
  );
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.reason, "expired");
  assert.equal(
    parseDonationSession(`${created.token}x`, SECRET, 1_000).ok,
    false,
  );
});

test("turnstile: success without action/hostname is rejected", async () => {
  const ok = await verifyTurnstileToken({
    secret: "secret",
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["localhost"],
    fetchImpl: siteverify({ success: true }),
  });
  assert.equal(ok.ok, false);
});

test("turnstile: wrong action rejected", async () => {
  const result = await verifyTurnstileToken({
    secret: "secret",
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["localhost"],
    fetchImpl: siteverify({
      success: true,
      action: "login",
      hostname: "localhost",
    }),
  });
  assert.equal(result.ok, false);
});

test("turnstile: wrong hostname rejected", async () => {
  const result = await verifyTurnstileToken({
    secret: "secret",
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["localhost"],
    fetchImpl: siteverify({
      success: true,
      action: TURNSTILE_ACTION,
      hostname: "evil.example",
    }),
  });
  assert.equal(result.ok, false);
});

test("turnstile: valid production-style action/hostname accepted", async () => {
  const env = enableSecurityEnv();
  envBag().NODE_ENV = "production";
  process.env.TURNSTILE_SECRET_KEY = "not-a-cloudflare-dummy-secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "not-a-cloudflare-dummy-sitekey";
  const result = await verifyTurnstileToken({
    secret: "not-a-cloudflare-dummy-secret",
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["localhost"],
    fetchImpl: siteverify({
      success: true,
      action: TURNSTILE_ACTION,
      hostname: "localhost",
    }),
  });
  assert.equal(result.ok, true);
  restoreEnv(env);
});

test("turnstile: production dummy credentials are not security-ready", () => {
  const env = enableSecurityEnv();
  envBag().NODE_ENV = "production";
  assert.equal(donationSecurityReady(), false);
  process.env.TURNSTILE_SECRET_KEY = "not-a-cloudflare-dummy-secret";
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
  assert.equal(donationSecurityReady(), false);
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "not-a-cloudflare-dummy-sitekey";
  process.env.TURNSTILE_SECRET_KEY = CLOUDFLARE_DUMMY_PASS_SECRET;
  assert.equal(donationSecurityReady(), false);
  process.env.TURNSTILE_SECRET_KEY = "not-a-cloudflare-dummy-secret";
  assert.equal(donationSecurityReady(), true);
  restoreEnv(env);
});

test("turnstile: production empty action is rejected", async () => {
  const env = enableSecurityEnv();
  envBag().NODE_ENV = "production";
  const dummy = await verifyTurnstileToken({
    secret: CLOUDFLARE_DUMMY_PASS_SECRET,
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["example.com"],
    fetchImpl: siteverify({
      success: true,
      hostname: "example.com",
    }),
  });
  assert.equal(dummy.ok, false);
  const realSecret = await verifyTurnstileToken({
    secret: "not-a-cloudflare-dummy-secret",
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["example.com"],
    fetchImpl: siteverify({
      success: true,
      hostname: "example.com",
    }),
  });
  assert.equal(realSecret.ok, false);
  restoreEnv(env);
});

test("turnstile: production wrong action is rejected", async () => {
  const env = enableSecurityEnv();
  envBag().NODE_ENV = "production";
  process.env.TURNSTILE_SECRET_KEY = "not-a-cloudflare-dummy-secret";
  const result = await verifyTurnstileToken({
    secret: "not-a-cloudflare-dummy-secret",
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["localhost"],
    fetchImpl: siteverify({
      success: true,
      action: "login",
      hostname: "localhost",
    }),
  });
  assert.equal(result.ok, false);
  restoreEnv(env);
});

test("turnstile: local dummy pass secret accepts Cloudflare test response", async () => {
  const env = enableSecurityEnv();
  const dummy = await verifyTurnstileToken({
    secret: CLOUDFLARE_DUMMY_PASS_SECRET,
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["example.com"],
    fetchImpl: siteverify({
      success: true,
      hostname: "example.com",
    }),
  });
  assert.equal(dummy.ok, true);
  restoreEnv(env);
});

test("turnstile: local real secret rejects empty action", async () => {
  const env = enableSecurityEnv();
  const productionSecret = await verifyTurnstileToken({
    secret: "not-the-cloudflare-dummy-secret",
    token: "token-token",
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: ["example.com"],
    fetchImpl: siteverify({
      success: true,
      hostname: "example.com",
    }),
  });
  assert.equal(productionSecret.ok, false);
  restoreEnv(env);
});

test("turnstile: wildcard hostname is not allow-listed", () => {
  const env = enableSecurityEnv();
  process.env.TURNSTILE_ALLOWED_HOSTNAMES = "example.com,*.vercel.app";
  const hosts = allowedTurnstileHostnames();
  assert.equal(hosts.has("localhost"), true);
  assert.equal(hosts.has("example.com"), true);
  assert.equal(
    [...hosts].some((host) => host.includes("*")),
    false,
  );
  restoreEnv(env);
});

test("status: card monthly paid only if active and invoice paid", () => {
  assert.equal(
    donationState({
      mode: "subscription",
      status: "complete",
      payment_status: "paid",
      subscription: { status: "active", latest_invoice: { status: "paid" } },
    }),
    "paid",
  );
  assert.equal(
    donationState({
      mode: "subscription",
      status: "complete",
      payment_status: "paid",
      subscription: { status: "trialing", latest_invoice: { status: "paid" } },
    }),
    "pending",
  );
});

test("status: SEPA one-time pending then paid or failed", () => {
  assert.equal(
    donationState({
      mode: "payment",
      status: "complete",
      payment_status: "unpaid",
      payment_intent: { status: "processing" },
    }),
    "pending",
  );
  assert.equal(
    donationState({
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      payment_intent: { status: "succeeded" },
    }),
    "paid",
  );
  assert.equal(
    donationState({
      mode: "payment",
      status: "complete",
      payment_status: "unpaid",
      payment_intent: { status: "canceled" },
    }),
    "unpaid",
  );
});

test("status: monthly SEPA pending, paid, failed", () => {
  assert.equal(
    donationState({
      mode: "subscription",
      status: "complete",
      payment_status: "unpaid",
      subscription: {
        status: "incomplete",
        latest_invoice: { status: "open" },
      },
    }),
    "pending",
  );
  assert.equal(
    donationState({
      mode: "subscription",
      status: "complete",
      payment_status: "paid",
      subscription: { status: "active", latest_invoice: { status: "paid" } },
    }),
    "paid",
  );
  assert.equal(
    donationState({
      mode: "subscription",
      status: "complete",
      payment_status: "unpaid",
      subscription: {
        status: "incomplete",
        latest_invoice: { status: "uncollectible" },
      },
    }),
    "unpaid",
  );
  assert.equal(
    donationState({
      mode: "subscription",
      status: "complete",
      payment_status: "paid",
      subscription: { status: "past_due", latest_invoice: { status: "open" } },
    }),
    "pending",
  );
  assert.equal(
    donationState({
      mode: "subscription",
      status: "complete",
      payment_status: "paid",
      subscription: { status: "canceled", latest_invoice: { status: "paid" } },
    }),
    "unpaid",
  );
});

test("email: thank-you only after verified success, shared session key", () => {
  assert.equal(
    shouldSendInitialThankYou("checkout.session.completed", "unpaid"),
    false,
  );
  assert.equal(
    shouldSendInitialThankYou("checkout.session.completed", "paid"),
    true,
  );
  assert.equal(
    shouldSendInitialThankYou(
      "checkout.session.async_payment_succeeded",
      "paid",
    ),
    true,
  );
  assert.equal(
    shouldSendInitialThankYou(
      "checkout.session.async_payment_failed",
      "unpaid",
    ),
    false,
  );
  assert.equal(shouldSendInitialThankYou("invoice.paid", "paid"), false);
  assert.equal(
    shouldSendInitialThankYou("invoice.payment_succeeded", "paid"),
    false,
  );
  assert.equal(
    shouldSendInitialThankYou("customer.subscription.updated", "active"),
    false,
  );
  assert.equal(
    shouldSendInitialThankYou("customer.subscription.deleted", "canceled"),
    false,
  );
  assert.equal(thankYouIdempotencyKey("cs_test_1"), "cir-donation-cs_test_1");
  assert.equal(
    thankYouIdempotencyKey("cs_test_1"),
    thankYouIdempotencyKey("cs_test_1"),
  );
});

test("checkout guard: missing session, CSRF, origin, turnstile, 429", async () => {
  const env = enableSecurityEnv();
  const created = createDonationSession(SECRET);
  const cookie = `${DONATION_SESSION_COOKIE}=${encodeURIComponent(created.token)}`;
  const limiterOk = async () => ({ ok: true as const });
  const turnstileOk = async () => ({ ok: true as const });

  const missing = await authorizeDonationCheckout(
    checkoutRequest({ csrf: created.session.csrf }),
    { limiter: limiterOk, verifyTurnstile: turnstileOk },
  );
  assert.equal(missing.ok, false);

  const csrf = await authorizeDonationCheckout(
    checkoutRequest({ cookie, csrf: "totally-invalid-csrf-token" }),
    { limiter: limiterOk, verifyTurnstile: turnstileOk },
  );
  assert.equal(csrf.ok, false);

  const origin = await authorizeDonationCheckout(
    checkoutRequest({
      origin: "https://evil.example",
      cookie,
      csrf: created.session.csrf,
    }),
    { limiter: limiterOk, verifyTurnstile: turnstileOk },
  );
  assert.equal(origin.ok, false);

  const turnstile = await authorizeDonationCheckout(
    checkoutRequest({ cookie, csrf: created.session.csrf }),
    { limiter: limiterOk, verifyTurnstile: async () => ({ ok: false }) },
  );
  assert.equal(turnstile.ok, false);

  const limited = await authorizeDonationCheckout(
    checkoutRequest({ cookie, csrf: created.session.csrf }),
    {
      limiter: async () => ({ ok: false, retryAfterSec: 42 }),
      verifyTurnstile: turnstileOk,
    },
  );
  assert.equal(limited.ok, false);
  if (!limited.ok) {
    assert.equal(limited.status, 429);
    assert.equal(limited.retryAfterSec, 42);
  }

  const expired = createDonationSession(SECRET, 1);
  const expiredCheck = await authorizeDonationCheckout(
    checkoutRequest({
      cookie: serializeDonationCookie(expired.token, 1, false),
      csrf: expired.session.csrf,
    }),
    {
      now: expired.session.exp + 10,
      limiter: limiterOk,
      verifyTurnstile: turnstileOk,
    },
  );
  assert.equal(expiredCheck.ok, false);

  const ok = await authorizeDonationCheckout(
    checkoutRequest({ cookie, csrf: created.session.csrf }),
    { limiter: limiterOk, verifyTurnstile: turnstileOk },
  );
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.donationCents, 2500);
    assert.equal(ok.contributionCents, 0);
  }

  const covered = await authorizeDonationCheckout(
    checkoutRequest({
      cookie,
      csrf: created.session.csrf,
      body: { ...validBody, coverProcessingCosts: true },
    }),
    { limiter: limiterOk, verifyTurnstile: turnstileOk },
  );
  assert.equal(covered.ok, true);
  if (covered.ok) {
    assert.equal(covered.contributionCents, 64);
    assert.equal(covered.totalCents, 2564);
  }

  restoreEnv(env);
});

test("origin: preview requires matching NEXT_PUBLIC_SITE_URL", () => {
  const preview = "https://cir-git-abc.vercel.app";
  const production = "https://www.cir-roma.it";
  const previewHeaders = new Headers({
    origin: preview,
    "sec-fetch-site": "same-origin",
  });
  const productionHeaders = new Headers({
    origin: production,
    "sec-fetch-site": "same-origin",
  });
  assert.equal(isSameSiteOrigin(previewHeaders, preview), true);
  assert.equal(isSameSiteOrigin(productionHeaders, preview), false);
  assert.equal(isSameSiteOrigin(previewHeaders, production), false);
});

test("session mint: origin mismatch and IP rate limit", async () => {
  const env = enableSecurityEnv();
  const mintOk = async () => ({ ok: true as const });

  const origin = await authorizeDonationSession(
    sessionRequest({ origin: "https://evil.example" }),
    { mintLimiter: mintOk },
  );
  assert.equal(origin.ok, false);
  if (!origin.ok) assert.equal(origin.status, 403);

  const limited = await authorizeDonationSession(sessionRequest({}), {
    mintLimiter: async () => ({ ok: false, retryAfterSec: 9 }),
  });
  assert.equal(limited.ok, false);
  if (!limited.ok) {
    assert.equal(limited.status, 429);
    assert.equal(limited.retryAfterSec, 9);
  }

  const created = createDonationSession(SECRET);
  let mintCalls = 0;
  const reused = await authorizeDonationSession(
    sessionRequest({
      cookie: `${DONATION_SESSION_COOKIE}=${encodeURIComponent(created.token)}`,
    }),
    {
      mintLimiter: async () => {
        mintCalls += 1;
        return { ok: false, retryAfterSec: 9 };
      },
    },
  );
  assert.equal(reused.ok, true);
  assert.equal(mintCalls, 0);

  const minted = await authorizeDonationSession(sessionRequest({}), {
    mintLimiter: mintOk,
  });
  assert.equal(minted.ok, true);

  restoreEnv(env);
});

test("client ip: local ignores spoofed X-Forwarded-For", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 198.51.100.1",
    "x-real-ip": "203.0.113.20",
  });
  assert.equal(trustedClientIp(headers), "unknown");
});

test("client ip: Vercel platform header beats left-most XFF", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 198.51.100.1",
    "x-vercel-forwarded-for": "198.51.100.9",
    "x-vercel-id": "fra1::abc",
  });
  assert.equal(trustedClientIp(headers), "198.51.100.9");
});

test("client ip: last XFF hop only when x-vercel-id is present", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    "x-vercel-id": "fra1::abc",
  });
  assert.equal(trustedClientIp(headers), "10.0.0.1");
});

test("client ip: IPv4-mapped and compressed IPv6 are normalized", () => {
  assert.equal(normalizeIp("::ffff:192.0.2.1"), "192.0.2.1");
  assert.equal(
    normalizeIp("2001:db8::1"),
    "2001:0db8:0000:0000:0000:0000:0000:0001",
  );
});

test("turnstile: token reset after failed checkout stays on the form", () => {
  assert.equal(
    shouldResetTurnstileAfterCheckout({ aborted: false, failed: true }),
    true,
  );
  assert.equal(
    shouldResetTurnstileAfterCheckout({ aborted: true, failed: true }),
    false,
  );
  assert.equal(
    shouldResetTurnstileAfterCheckout({ aborted: false, failed: false }),
    false,
  );
});

test("turnstile client: no token blocks checkout", () => {
  const turnstile = emptyTurnstileClientState();
  assert.equal(canSubmitDonationCheckout({ busy: false, turnstile }), false);
  const prep = prepareDonationCheckout({ busy: false, turnstile });
  assert.equal(prep.ok, false);
  if (!prep.ok) assert.equal(prep.reason, "turnstile_not_ready");
});

test("turnstile client: fresh token allows one checkout", () => {
  const token = "fresh-turnstile-token";
  const turnstile = applyTurnstileCallback(emptyTurnstileClientState(), token);
  assert.equal(canSubmitDonationCheckout({ busy: false, turnstile }), true);
  const prep = prepareDonationCheckout({ busy: false, turnstile });
  assert.equal(prep.ok, true);
  if (prep.ok) {
    assert.equal(prep.token, token);
    assert.equal(prep.turnstile.fresh, false);
    assert.equal(prep.turnstile.token, "");
  }
});

test("turnstile client: failed checkout clears token until callback", () => {
  const first = applyTurnstileCallback(
    emptyTurnstileClientState(),
    "token-before-failure",
  );
  const sent = prepareDonationCheckout({ busy: false, turnstile: first });
  assert.equal(sent.ok, true);
  assert.equal(
    shouldResetTurnstileAfterCheckout({ aborted: false, failed: true }),
    true,
  );
  const reset = beginTurnstileReset();
  assert.equal(reset.fresh, false);
  assert.equal(reset.token, "");
  assert.equal(
    canSubmitDonationCheckout({ busy: false, turnstile: reset }),
    false,
  );
  assert.equal(
    prepareDonationCheckout({ busy: false, turnstile: reset }).ok,
    false,
  );
});

test("turnstile client: submit stays blocked before fresh callback", () => {
  const reset = beginTurnstileReset();
  assert.equal(
    canSubmitDonationCheckout({ busy: false, turnstile: reset }),
    false,
  );
  const emptyCallback = applyTurnstileCallback(reset, "");
  assert.equal(emptyCallback.fresh, false);
  assert.equal(
    prepareDonationCheckout({ busy: false, turnstile: emptyCallback }).ok,
    false,
  );
});

test("turnstile client: callback re-enables submit", () => {
  const afterReset = beginTurnstileReset();
  const ready = applyTurnstileCallback(afterReset, "token-after-reset-ok");
  assert.equal(ready.fresh, true);
  assert.equal(
    canSubmitDonationCheckout({ busy: false, turnstile: ready }),
    true,
  );
  const prep = prepareDonationCheckout({ busy: false, turnstile: ready });
  assert.equal(prep.ok, true);
});

test("turnstile client: consumed token is not reused without a new callback", () => {
  const dummy = "XXXX.DUMMY.TOKEN.XXXX";
  const ready = applyTurnstileCallback(emptyTurnstileClientState(), dummy);
  const first = prepareDonationCheckout({ busy: false, turnstile: ready });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const reuse = prepareDonationCheckout({
    busy: false,
    turnstile: first.turnstile,
  });
  assert.equal(reuse.ok, false);
  const sameStringWithoutCallback = {
    token: dummy,
    fresh: false,
  };
  assert.equal(
    prepareDonationCheckout({
      busy: false,
      turnstile: sameStringWithoutCallback,
    }).ok,
    false,
  );
  const afterCallback = applyTurnstileCallback(first.turnstile, dummy);
  const second = prepareDonationCheckout({
    busy: false,
    turnstile: afterCallback,
  });
  assert.equal(second.ok, true);
  if (second.ok) assert.equal(second.token, dummy);
});

test("turnstile client: busy checkout cannot submit", () => {
  const turnstile = applyTurnstileCallback(
    emptyTurnstileClientState(),
    "fresh-turnstile-token",
  );
  assert.equal(canSubmitDonationCheckout({ busy: true, turnstile }), false);
  const prep = prepareDonationCheckout({ busy: true, turnstile });
  assert.equal(prep.ok, false);
  if (!prep.ok) assert.equal(prep.reason, "busy");
});

test("status: card one-time paid is unchanged", () => {
  assert.equal(
    donationState({
      mode: "payment",
      status: "complete",
      payment_status: "paid",
      payment_intent: { status: "succeeded" },
    }),
    "paid",
  );
});
