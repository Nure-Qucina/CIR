import {
  CLOUDFLARE_DUMMY_PASS_SECRET,
  TURNSTILE_ACTION,
  getPublicSiteUrl,
  isCloudflareDummyTurnstileSecret,
  isProductionDeployment,
} from "./config";

export { TURNSTILE_ACTION };

export function normalizeHostname(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 253) return null;
  try {
    const host = trimmed.includes("://")
      ? new URL(trimmed).hostname
      : new URL(`https://${trimmed}`).hostname;
    return host || null;
  } catch {
    return null;
  }
}

/**
 * Hostnames allowed in Cloudflare Siteverify `hostname`.
 * Always includes NEXT_PUBLIC_SITE_URL. Extra names from
 * TURNSTILE_ALLOWED_HOSTNAMES (comma-separated). No wildcards.
 */
export function allowedTurnstileHostnames(): Set<string> {
  const hosts = new Set<string>();
  const site = getPublicSiteUrl();
  if (site) {
    const host = normalizeHostname(site.hostname);
    if (host && !host.includes("*")) hosts.add(host);
  }
  const extra = process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "";
  for (const part of extra.split(",")) {
    const host = normalizeHostname(part);
    if (host && !host.includes("*")) hosts.add(host);
  }
  return hosts;
}

export type TurnstileResult = { ok: true } | { ok: false };

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function allowLocalDummyEmptyAction(secret: string): boolean {
  return !isProductionDeployment() && secret === CLOUDFLARE_DUMMY_PASS_SECRET;
}

function actionMatches(
  observed: string,
  expected: string,
  secret: string,
): boolean {
  if (observed === expected) return true;
  return allowLocalDummyEmptyAction(secret) && observed === "";
}

/**
 * Server-side Turnstile Siteverify. Tokens are single-use.
 * Requires success, expected action, and an allow-listed hostname.
 * Hostname/action from the client body are ignored.
 */
export async function verifyTurnstileToken(input: {
  secret: string;
  token: unknown;
  ip?: string;
  expectedAction?: string;
  allowedHostnames?: Iterable<string>;
  fetchImpl?: typeof fetch;
}): Promise<TurnstileResult> {
  if (typeof input.token !== "string" || input.token.length < 8) {
    return { ok: false };
  }
  if (input.token.length > 4096) return { ok: false };

  const expectedAction = input.expectedAction ?? TURNSTILE_ACTION;
  const allowed = new Set(
    [...(input.allowedHostnames ?? allowedTurnstileHostnames())]
      .map((host) => host.toLowerCase())
      .filter((host) => host && !host.includes("*")),
  );
  if (!expectedAction || allowed.size === 0) return { ok: false };
  if (
    isProductionDeployment() &&
    isCloudflareDummyTurnstileSecret(input.secret)
  ) {
    return { ok: false };
  }

  const body = new URLSearchParams();
  body.set("secret", input.secret);
  body.set("response", input.token);
  if (input.ip && input.ip !== "unknown") body.set("remoteip", input.ip);

  try {
    const fetchImpl = input.fetchImpl ?? fetch;
    const response = await fetchImpl(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    if (!response.ok) return { ok: false };
    const data: unknown = await response.json();
    if (!data || typeof data !== "object") return { ok: false };
    const record = data as Record<string, unknown>;
    if (record.success !== true) return { ok: false };
    if (
      !actionMatches(readString(record, "action"), expectedAction, input.secret)
    ) {
      return { ok: false };
    }
    const hostname = normalizeHostname(readString(record, "hostname"));
    if (!hostname || hostname.includes("*") || !allowed.has(hostname)) {
      return { ok: false };
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
