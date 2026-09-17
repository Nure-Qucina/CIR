import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map.set(key, value);
  }
  return map;
}

function get(map, key) {
  return (map.get(key) ?? "").trim();
}

function originOk(value) {
  try {
    const url = new URL(value);
    return (
      url.origin === "http://localhost:3100" &&
      url.pathname === "/" &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function httpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function portalOk(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "billing.stripe.com" &&
      /^\/p\/login\/[A-Za-z0-9_]+$/.test(url.pathname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

const required = [
  {
    key: "DONATIONS_ENABLED",
    check: (value) =>
      value === "true" ? "PRESENT" : value ? "INVALID" : "MISSING",
  },
  {
    key: "STRIPE_SECRET_KEY",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "NEXT_PUBLIC_SITE_URL",
    check: (value) => {
      if (!value) return "MISSING";
      return originOk(value) ? "PRESENT" : "INVALID";
    },
  },
  {
    key: "DONATION_SESSION_SECRET",
    check: (value) => {
      if (!value) return "MISSING";
      return value.length >= 32 ? "PRESENT" : "INVALID";
    },
  },
  {
    key: "UPSTASH_REDIS_REST_URL",
    check: (value) => {
      if (!value) return "MISSING";
      return httpsUrl(value) ? "PRESENT" : "INVALID";
    },
  },
  {
    key: "UPSTASH_REDIS_REST_TOKEN",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "TURNSTILE_SECRET_KEY",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
];

const optional = [
  {
    key: "STRIPE_WEBHOOK_SECRET",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "RESEND_API_KEY",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_EMAIL_FROM",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "STRIPE_CUSTOMER_PORTAL_LOGIN_URL",
    check: (value) => {
      if (!value) return "MISSING";
      return portalOk(value) ? "PRESENT" : "INVALID";
    },
  },
  {
    key: "DONATION_FEE_REFERENCE_BPS",
    check: (value) => {
      if (!value) return "MISSING";
      return /^\d{1,6}$/.test(value) && Number(value) < 10000
        ? "PRESENT"
        : "INVALID";
    },
  },
  {
    key: "DONATION_FEE_REFERENCE_FIXED_CENTS",
    check: (value) => {
      if (!value) return "MISSING";
      return /^\d{1,6}$/.test(value) ? "PRESENT" : "INVALID";
    },
  },
  {
    key: "TURNSTILE_ALLOWED_HOSTNAMES",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_RATE_LIMIT_SESSION_MAX",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_RATE_LIMIT_SESSION_WINDOW_SEC",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_RATE_LIMIT_IP_MAX",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_RATE_LIMIT_IP_WINDOW_SEC",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_RATE_LIMIT_EMAIL_MAX",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_RATE_LIMIT_EMAIL_WINDOW_SEC",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_RATE_LIMIT_MINT_MAX",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
  {
    key: "DONATION_RATE_LIMIT_MINT_WINDOW_SEC",
    check: (value) => (value ? "PRESENT" : "MISSING"),
  },
];

if (!existsSync(envPath)) {
  console.error("MISSING .env.local");
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, "utf8"));
const missingRequired = [];

console.log("Required for local checkout");
for (const item of required) {
  const status = item.check(get(env, item.key));
  console.log(`${item.key}: ${status}`);
  if (status !== "PRESENT") missingRequired.push(item.key);
}

console.log("");
console.log("Optional");
for (const item of optional) {
  console.log(`${item.key}: ${item.check(get(env, item.key))}`);
}

if (missingRequired.length) {
  console.log("");
  console.log("Missing/invalid required:");
  for (const key of missingRequired) console.log(key);
  process.exit(1);
}
