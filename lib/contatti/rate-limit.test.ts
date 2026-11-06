import { test } from "node:test";
import assert from "node:assert/strict";
import { chiaveLimite, controllaLimiteContatti } from "./rate-limit";
import { CONTACT_RATE_LIMIT } from "./guard";

const SEGRETO = "segreto-di-test-lungo-almeno-32-caratteri";

/** Finto limiter a finestra fissa, per contare gli invii nei test. */
function fintoLimiter(max: number) {
  const conteggi = new Map<string, number>();
  const chiavi: string[] = [];
  return {
    chiavi,
    crea: async () => ({
      limit: async (key: string) => {
        chiavi.push(key);
        const n = (conteggi.get(key) ?? 0) + 1;
        conteggi.set(key, n);
        return { success: n <= max };
      },
    }),
  };
}

test("il 4° invio dalla stessa connessione viene fermato", async () => {
  const finto = fintoLimiter(CONTACT_RATE_LIMIT.max);
  const deps = { configured: true, secret: SEGRETO, production: true, creaLimiter: finto.crea };
  const esiti = [];
  for (let i = 0; i < 4; i++) esiti.push(await controllaLimiteContatti("203.0.113.7", deps));
  assert.deepEqual(esiti, ["ok", "ok", "ok", "limite"]);
  // un'altra connessione non è toccata
  assert.equal(await controllaLimiteContatti("198.51.100.2", deps), "ok");
});

test("la chiave è un HMAC: niente IP in chiaro, e cambia col segreto", async () => {
  const finto = fintoLimiter(3);
  await controllaLimiteContatti("203.0.113.7", {
    configured: true,
    secret: SEGRETO,
    production: true,
    creaLimiter: finto.crea,
  });
  assert.equal(finto.chiavi[0], chiaveLimite(SEGRETO, "203.0.113.7"));
  assert.doesNotMatch(finto.chiavi[0], /203\.0\.113\.7/);
  assert.match(finto.chiavi[0], /^[0-9a-f]{32}$/);
  assert.notEqual(chiaveLimite(SEGRETO, "203.0.113.7"), chiaveLimite("altro-segreto", "203.0.113.7"));
});

test("produzione: senza Upstash, senza segreto o con Upstash giù il messaggio non parte", async () => {
  assert.equal(
    await controllaLimiteContatti("1.2.3.4", { configured: false, secret: SEGRETO, production: true }),
    "nonDisponibile",
  );
  assert.equal(
    await controllaLimiteContatti("1.2.3.4", { configured: true, secret: null, production: true }),
    "nonDisponibile",
  );
  const rotto = async () => {
    throw new Error("redis down");
  };
  assert.equal(
    await controllaLimiteContatti("1.2.3.4", {
      configured: true,
      secret: SEGRETO,
      production: true,
      creaLimiter: rotto,
    }),
    "nonDisponibile",
  );
});

test("sviluppo: senza Upstash o segreto si prosegue", async () => {
  assert.equal(
    await controllaLimiteContatti("1.2.3.4", { configured: false, secret: null, production: false }),
    "ok",
  );
});

test("il limite è 3 invii ogni 20 minuti", () => {
  assert.deepEqual(CONTACT_RATE_LIMIT, { max: 3, window: "20 m" });
});
