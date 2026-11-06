import { createHmac } from "node:crypto";
import { CONTACT_RATE_LIMIT } from "./guard";

export type EsitoLimite = "ok" | "limite" | "nonDisponibile";

type Limiter = { limit: (key: string) => Promise<{ success: boolean }> };

export type LimiteDeps = {
  configured: boolean;
  /** Segreto server per la chiave HMAC (senza segreto: come Upstash assente). */
  secret: string | null;
  production: boolean;
  /** Crea il limiter (in produzione: Upstash). Iniettabile nei test. */
  creaLimiter?: () => Promise<Limiter>;
};

async function creaUpstashLimiter(): Promise<Limiter> {
  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import("@upstash/ratelimit"),
    import("@upstash/redis"),
  ]);
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(
      CONTACT_RATE_LIMIT.max,
      CONTACT_RATE_LIMIT.window,
    ),
    prefix: "cir:contatti:ip",
    analytics: false,
  });
}

/**
 * Chiave del limite: HMAC dell'IP con un segreto server, come le donazioni
 * (hashedLimiterKey). Un hash semplice si invertirebbe provando tutti gli IPv4.
 */
export function chiaveLimite(secret: string, ip: string): string {
  return createHmac("sha256", secret)
    .update(`contatti:ip:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Max CONTACT_RATE_LIMIT.max invii per finestra dalla stessa connessione.
 * In produzione è obbligatorio: senza Upstash, o se Upstash non risponde,
 * il messaggio non parte (fail closed, come le donazioni). In sviluppo si
 * prosegue senza limite.
 */
export async function controllaLimiteContatti(
  ip: string,
  deps: LimiteDeps,
): Promise<EsitoLimite> {
  if (!deps.configured || !deps.secret) {
    return deps.production ? "nonDisponibile" : "ok";
  }
  try {
    const limiter = await (deps.creaLimiter ?? creaUpstashLimiter)();
    return (await limiter.limit(chiaveLimite(deps.secret, ip))).success ? "ok" : "limite";
  } catch {
    return deps.production ? "nonDisponibile" : "ok";
  }
}
