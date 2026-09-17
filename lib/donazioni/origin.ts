/**
 * Same-origin check for donation POSTs.
 * Uses Origin (or Referer origin) against the configured site origin.
 * Does not trust forwarded Host.
 */
export function requestOrigin(headers: Headers): string | null {
  const origin = headers.get("origin")?.trim();
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      return null;
    }
  }
  const referer = headers.get("referer")?.trim();
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

export function isSameSiteOrigin(
  headers: Headers,
  configuredOrigin: string,
): boolean {
  const actual = requestOrigin(headers);
  if (!actual || actual !== configuredOrigin) return false;
  const fetchSite = headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    return false;
  }
  return true;
}
