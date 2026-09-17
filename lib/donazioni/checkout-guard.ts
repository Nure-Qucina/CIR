import {
  donationSecurityReady,
  donationSessionSecret,
  getPublicSiteUrl,
  isDonationsEnabled,
  TURNSTILE_ACTION,
  turnstileSecretKey,
} from "./config";
import { trustedClientIp } from "./client-ip";
import { getFeeReference, donationTotals } from "./fees";
import { isSameSiteOrigin } from "./origin";
import {
  createUpstashCheckoutLimiter,
  type CheckoutLimiter,
  type RateLimitResult,
} from "./rate-limit";
import {
  csrfFromRequest,
  csrfMatches,
  donationSessionCookieValue,
  hashedLimiterKey,
  parseDonationSession,
  type SessionCheck,
} from "./session";
import { allowedTurnstileHostnames, verifyTurnstileToken } from "./turnstile";
import {
  parseCheckoutRequest,
  parseTurnstileToken,
  type ParsedCheckoutRequest,
} from "./validation";

export type GuardFailure = {
  ok: false;
  status: number;
  error: string;
  retryAfterSec?: number;
};

export type GuardSuccess = {
  ok: true;
  value: ParsedCheckoutRequest;
  donationCents: number;
  contributionCents: number;
  totalCents: number;
};

export type CheckoutGuardDeps = {
  now?: number;
  limiter?: CheckoutLimiter;
  verifyTurnstile?: typeof verifyTurnstileToken;
};

function fail(
  status: number,
  error: string,
  retryAfterSec?: number,
): GuardFailure {
  return { ok: false, status, error, retryAfterSec };
}

export async function authorizeDonationCheckout(
  request: Request,
  deps: CheckoutGuardDeps = {},
): Promise<GuardSuccess | GuardFailure> {
  if (!isDonationsEnabled(process.env.DONATIONS_ENABLED)) {
    return fail(503, "donations_disabled");
  }
  if (!donationSecurityReady()) {
    return fail(503, "donations_not_configured");
  }

  const siteUrl = getPublicSiteUrl();
  const secret = donationSessionSecret();
  const turnstileSecret = turnstileSecretKey();
  if (!siteUrl || !secret || !turnstileSecret) {
    return fail(503, "donations_not_configured");
  }

  if (!isSameSiteOrigin(request.headers, siteUrl.origin)) {
    return fail(403, "invalid_request");
  }

  const sessionCheck: SessionCheck = parseDonationSession(
    donationSessionCookieValue(request.headers.get("cookie")),
    secret,
    deps.now,
  );
  if (!sessionCheck.ok) {
    return fail(403, "invalid_request");
  }
  if (!csrfMatches(sessionCheck.session, csrfFromRequest(request.headers))) {
    return fail(403, "invalid_request");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_request");
  }

  const limiter = deps.limiter ?? (await createUpstashCheckoutLimiter());
  const ip = trustedClientIp(request.headers);
  const parsedPreview = parseCheckoutRequest(body);
  const emailForLimit = parsedPreview.ok
    ? parsedPreview.value.email.trim().toLowerCase()
    : "";
  try {
    const limited: RateLimitResult = await limiter({
      sessionId: sessionCheck.session.id,
      ipHash: hashedLimiterKey(secret, "ip", ip),
      emailHash: hashedLimiterKey(secret, "email", emailForLimit || "unknown"),
    });
    if (!limited.ok) {
      return fail(429, "too_many_requests", limited.retryAfterSec);
    }
  } catch {
    return fail(503, "donations_not_configured");
  }

  const turnstile = await (deps.verifyTurnstile ?? verifyTurnstileToken)({
    secret: turnstileSecret,
    token: parseTurnstileToken(body),
    ip,
    expectedAction: TURNSTILE_ACTION,
    allowedHostnames: allowedTurnstileHostnames(),
  });
  if (!turnstile.ok) return fail(403, "invalid_request");

  const parsed = parsedPreview.ok ? parsedPreview : parseCheckoutRequest(body);
  if (!parsed.ok) return fail(400, parsed.error);

  const totals = donationTotals(
    parsed.value.amountCents,
    parsed.value.coverProcessingCosts,
    getFeeReference(),
  );
  if (!totals.ok) return fail(400, totals.error);

  return {
    ok: true,
    value: parsed.value,
    donationCents: totals.donationCents,
    contributionCents: totals.contributionCents,
    totalCents: totals.totalCents,
  };
}
