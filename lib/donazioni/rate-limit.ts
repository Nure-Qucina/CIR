import {
  DONATION_RATE_EMAIL_MAX,
  DONATION_RATE_EMAIL_WINDOW_SEC,
  DONATION_RATE_IP_MAX,
  DONATION_RATE_IP_WINDOW_SEC,
  DONATION_RATE_MINT_MAX,
  DONATION_RATE_MINT_WINDOW_SEC,
  DONATION_RATE_SESSION_MAX,
  DONATION_RATE_SESSION_WINDOW_SEC,
} from "./config";

export type RateLimitResult =
  { ok: true } | { ok: false; retryAfterSec: number };

export type CheckoutLimiter = (input: {
  sessionId: string;
  ipHash: string;
  emailHash: string;
}) => Promise<RateLimitResult>;

export type IpMintLimiter = (ipHash: string) => Promise<RateLimitResult>;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim() ?? "";
  if (!/^\d{1,7}$/.test(raw)) return fallback;
  const value = Number(raw);
  return value > 0 ? value : fallback;
}

export function rateLimitConfig(): {
  sessionMax: number;
  sessionWindowSec: number;
  ipMax: number;
  ipWindowSec: number;
  emailMax: number;
  emailWindowSec: number;
  mintMax: number;
  mintWindowSec: number;
} {
  return {
    sessionMax: envInt(
      "DONATION_RATE_LIMIT_SESSION_MAX",
      DONATION_RATE_SESSION_MAX,
    ),
    sessionWindowSec: envInt(
      "DONATION_RATE_LIMIT_SESSION_WINDOW_SEC",
      DONATION_RATE_SESSION_WINDOW_SEC,
    ),
    ipMax: envInt("DONATION_RATE_LIMIT_IP_MAX", DONATION_RATE_IP_MAX),
    ipWindowSec: envInt(
      "DONATION_RATE_LIMIT_IP_WINDOW_SEC",
      DONATION_RATE_IP_WINDOW_SEC,
    ),
    emailMax: envInt("DONATION_RATE_LIMIT_EMAIL_MAX", DONATION_RATE_EMAIL_MAX),
    emailWindowSec: envInt(
      "DONATION_RATE_LIMIT_EMAIL_WINDOW_SEC",
      DONATION_RATE_EMAIL_WINDOW_SEC,
    ),
    mintMax: envInt("DONATION_RATE_LIMIT_MINT_MAX", DONATION_RATE_MINT_MAX),
    mintWindowSec: envInt(
      "DONATION_RATE_LIMIT_MINT_WINDOW_SEC",
      DONATION_RATE_MINT_WINDOW_SEC,
    ),
  };
}

export function retryAfterSec(reset: number): number {
  return Math.max(1, Math.ceil((reset - Date.now()) / 1000));
}

export async function createUpstashCheckoutLimiter(): Promise<CheckoutLimiter> {
  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import("@upstash/ratelimit"),
    import("@upstash/redis"),
  ]);
  const redis = Redis.fromEnv();
  const cfg = rateLimitConfig();
  const sessionLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      cfg.sessionMax,
      `${cfg.sessionWindowSec} s`,
    ),
    prefix: "cir:don:sess",
    analytics: false,
  });
  const ipLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.ipMax, `${cfg.ipWindowSec} s`),
    prefix: "cir:don:ip",
    analytics: false,
  });
  const emailLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.emailMax, `${cfg.emailWindowSec} s`),
    prefix: "cir:don:em",
    analytics: false,
  });

  return async ({ sessionId, ipHash, emailHash }) => {
    const [session, ip, email] = await Promise.all([
      sessionLimit.limit(sessionId),
      ipLimit.limit(ipHash),
      emailLimit.limit(emailHash),
    ]);
    if (session.success && ip.success && email.success) return { ok: true };
    const reset = Math.max(session.reset, ip.reset, email.reset);
    return { ok: false, retryAfterSec: retryAfterSec(reset) };
  };
}

export async function createUpstashMintLimiter(): Promise<IpMintLimiter> {
  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import("@upstash/ratelimit"),
    import("@upstash/redis"),
  ]);
  const redis = Redis.fromEnv();
  const cfg = rateLimitConfig();
  const mintLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(cfg.mintMax, `${cfg.mintWindowSec} s`),
    prefix: "cir:don:mint",
    analytics: false,
  });

  return async (ipHash) => {
    const result = await mintLimit.limit(ipHash);
    if (result.success) return { ok: true };
    return { ok: false, retryAfterSec: retryAfterSec(result.reset) };
  };
}
