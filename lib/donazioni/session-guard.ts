import {
  DONATION_SESSION_TTL_SEC,
  donationSecurityReady,
  donationSessionSecret,
  getPublicSiteUrl,
  isDonationsEnabled,
  turnstileSiteKey,
} from "./config";
import { trustedClientIp } from "./client-ip";
import { getFeeReference, type FeeReference } from "./fees";
import { isSameSiteOrigin } from "./origin";
import {
  createUpstashMintLimiter,
  type IpMintLimiter,
  type RateLimitResult,
} from "./rate-limit";
import {
  createDonationSession,
  donationSessionCookieValue,
  hashedLimiterKey,
  parseDonationSession,
  serializeDonationCookie,
} from "./session";

export type SessionGuardFailure = {
  ok: false;
  status: number;
  error: string;
  retryAfterSec?: number;
};

export type SessionGuardSuccess = {
  ok: true;
  csrfToken: string;
  turnstileSiteKey: string;
  feeReference: FeeReference;
  cookie: string;
};

export type SessionGuardDeps = {
  now?: number;
  mintLimiter?: IpMintLimiter;
};

function fail(
  status: number,
  error: string,
  retryAfterSec?: number,
): SessionGuardFailure {
  return { ok: false, status, error, retryAfterSec };
}

export async function authorizeDonationSession(
  request: Request,
  deps: SessionGuardDeps = {},
): Promise<SessionGuardSuccess | SessionGuardFailure> {
  if (!isDonationsEnabled(process.env.DONATIONS_ENABLED)) {
    return fail(503, "donations_disabled");
  }
  if (!donationSecurityReady()) {
    return fail(503, "donations_not_configured");
  }

  const siteUrl = getPublicSiteUrl();
  const secret = donationSessionSecret();
  const siteKey = turnstileSiteKey();
  if (!siteUrl || !secret || !siteKey) {
    return fail(503, "donations_not_configured");
  }
  if (!isSameSiteOrigin(request.headers, siteUrl.origin)) {
    return fail(403, "invalid_request");
  }

  const now = deps.now ?? Date.now();
  const cookieValue = donationSessionCookieValue(request.headers.get("cookie"));
  const existing = parseDonationSession(cookieValue, secret, now);
  if (!existing.ok) {
    const limiter = deps.mintLimiter ?? (await createUpstashMintLimiter());
    const ip = trustedClientIp(request.headers);
    try {
      const limited: RateLimitResult = await limiter(
        hashedLimiterKey(secret, "ip", ip),
      );
      if (!limited.ok) {
        return fail(429, "too_many_requests", limited.retryAfterSec);
      }
    } catch {
      return fail(503, "donations_not_configured");
    }
  }

  const issued = existing.ok
    ? { token: cookieValue as string, session: existing.session }
    : createDonationSession(secret, now);
  const maxAge = existing.ok
    ? Math.max(1, Math.floor((existing.session.exp - now) / 1000))
    : DONATION_SESSION_TTL_SEC;

  return {
    ok: true,
    csrfToken: issued.session.csrf,
    turnstileSiteKey: siteKey,
    feeReference: getFeeReference(),
    cookie: serializeDonationCookie(
      issued.token,
      maxAge,
      siteUrl.protocol === "https:",
    ),
  };
}
