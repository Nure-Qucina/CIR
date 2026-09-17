import { isIP } from "node:net";

/**
 * Client IP for rate-limit hashing and Turnstile remoteip.
 *
 * Vercel: use `x-vercel-forwarded-for` (platform-set, not the left-most
 * X-Forwarded-For). Fallback: last X-Forwarded-For hop only when `x-vercel-id`
 * is present (Vercel appends the connecting IP).
 *
 * Local: ignore X-Forwarded-For / X-Real-IP (spoofable). Hash as "unknown".
 * Never log the raw value.
 */
function expandIpv6(ip: string): string {
  if (!ip.includes(":")) return ip;
  if (!ip.includes("::")) {
    return ip
      .split(":")
      .map((part) => part.padStart(4, "0"))
      .join(":");
  }
  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":").filter(Boolean) : [];
  const tailParts = tail ? tail.split(":").filter(Boolean) : [];
  const missing = Math.max(0, 8 - headParts.length - tailParts.length);
  return [...headParts, ...Array<string>(missing).fill("0"), ...tailParts]
    .map((part) => part.padStart(4, "0"))
    .join(":");
}

export function normalizeIp(value: string): string | null {
  let ip = value.trim().replace(/^"|"$/g, "");
  if (!ip || ip.length > 128) return null;

  const mappedV4 = ip.match(/^\[?::ffff:(\d{1,3}(?:\.\d{1,3}){3})\]?$/i);
  if (mappedV4) ip = mappedV4[1];

  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    if (end < 2) return null;
    ip = ip.slice(1, end);
  } else if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(":"));
  }

  const zone = ip.indexOf("%");
  if (zone >= 0) ip = ip.slice(0, zone);
  ip = ip.toLowerCase();
  const version = isIP(ip);
  if (version === 4) return ip;
  if (version === 6) return expandIpv6(ip);
  return null;
}

function headerIp(headers: Headers, name: string): string | null {
  const raw = headers.get(name)?.trim() ?? "";
  if (!raw) return null;
  const first = raw.split(",")[0]?.trim() ?? "";
  return normalizeIp(first);
}

function lastForwardedHop(headers: Headers): string | null {
  const raw = headers.get("x-forwarded-for")?.trim() ?? "";
  if (!raw) return null;
  const hops = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const last = hops[hops.length - 1];
  return last ? normalizeIp(last) : null;
}

export function trustedClientIp(headers: Headers): string {
  const vercelForwarded = headerIp(headers, "x-vercel-forwarded-for");
  if (vercelForwarded) return vercelForwarded;
  if (headers.get("x-vercel-id")?.trim()) {
    return lastForwardedHop(headers) ?? "unknown";
  }
  return "unknown";
}
