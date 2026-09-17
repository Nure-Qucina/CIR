import {
  donationSecurityReady,
  isDonationsEnabled,
} from "@/lib/donazioni/config";
import { authorizeDonationSession } from "@/lib/donazioni/session-guard";

export const runtime = "nodejs";

function json(
  body: Record<string, unknown>,
  status: number,
  extra?: { cookie?: string; retryAfterSec?: number },
) {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (extra?.cookie) headers.set("Set-Cookie", extra.cookie);
  if (extra?.retryAfterSec) {
    headers.set("Retry-After", String(extra.retryAfterSec));
  }
  return Response.json(body, { status, headers });
}

export async function POST(request: Request): Promise<Response> {
  if (!isDonationsEnabled(process.env.DONATIONS_ENABLED)) {
    return json({ error: "donations_disabled" }, 503);
  }
  if (!donationSecurityReady()) {
    return json({ error: "donations_not_configured" }, 503);
  }

  const result = await authorizeDonationSession(request);
  if (!result.ok) {
    return json(
      { error: result.error },
      result.status,
      result.retryAfterSec
        ? { retryAfterSec: result.retryAfterSec }
        : undefined,
    );
  }

  return json(
    {
      csrfToken: result.csrfToken,
      turnstileSiteKey: result.turnstileSiteKey,
      feeReference: result.feeReference,
    },
    200,
    { cookie: result.cookie },
  );
}
