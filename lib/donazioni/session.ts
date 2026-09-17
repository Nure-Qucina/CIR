import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  DONATION_CSRF_HEADER,
  DONATION_SESSION_COOKIE,
  DONATION_SESSION_TTL_SEC,
} from "./config";

export type DonationSessionPayload = {
  v: 1;
  id: string;
  csrf: string;
  exp: number;
};

export type SessionCheck =
  | { ok: true; session: DonationSessionPayload }
  | { ok: false; reason: "missing" | "invalid" | "expired" };

function b64url(data: Buffer | string): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf.toString("base64url");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function equal(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createDonationSession(
  secret: string,
  now = Date.now(),
): { token: string; session: DonationSessionPayload } {
  const session: DonationSessionPayload = {
    v: 1,
    id: randomBytes(16).toString("hex"),
    csrf: randomBytes(32).toString("base64url"),
    exp: now + DONATION_SESSION_TTL_SEC * 1000,
  };
  const payload = b64url(JSON.stringify(session));
  return { token: `${payload}.${sign(payload, secret)}`, session };
}

export function parseDonationSession(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): SessionCheck {
  if (!token) return { ok: false, reason: "missing" };
  const dot = token.lastIndexOf(".");
  if (dot < 1) return { ok: false, reason: "invalid" };
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!payload || !mac || !equal(sign(payload, secret), mac)) {
    return { ok: false, reason: "invalid" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    (parsed as DonationSessionPayload).v !== 1 ||
    typeof (parsed as DonationSessionPayload).id !== "string" ||
    !/^[a-f0-9]{32}$/.test((parsed as DonationSessionPayload).id) ||
    typeof (parsed as DonationSessionPayload).csrf !== "string" ||
    (parsed as DonationSessionPayload).csrf.length < 16 ||
    typeof (parsed as DonationSessionPayload).exp !== "number"
  ) {
    return { ok: false, reason: "invalid" };
  }
  const session = parsed as DonationSessionPayload;
  if (session.exp <= now) return { ok: false, reason: "expired" };
  return { ok: true, session };
}

export function readCookie(
  cookieHeader: string | null,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return undefined;
}

export function donationSessionCookieValue(
  cookieHeader: string | null,
): string | undefined {
  return readCookie(cookieHeader, DONATION_SESSION_COOKIE);
}

export function csrfFromRequest(headers: Headers): string {
  return headers.get(DONATION_CSRF_HEADER)?.trim() ?? "";
}

export function csrfMatches(
  session: DonationSessionPayload,
  csrf: string,
): boolean {
  if (!csrf || csrf.length < 16) return false;
  return equal(session.csrf, csrf);
}

export function serializeDonationCookie(
  token: string,
  maxAgeSec: number,
  secure: boolean,
): string {
  const parts = [
    `${DONATION_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function hashedLimiterKey(
  secret: string,
  kind: "email" | "ip",
  value: string,
): string {
  return createHmac("sha256", secret)
    .update(`${kind}:${value}`)
    .digest("hex")
    .slice(0, 32);
}
