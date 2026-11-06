import { test } from "node:test";
import assert from "node:assert/strict";
import { keystaticChiuso } from "./keystatic-guard";

const SLUG = { NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: "cir-keystatic" };

test("sul computer di sviluppo la modalità locale resta aperta", () => {
  assert.equal(keystaticChiuso({}), false);
  assert.equal(keystaticChiuso({ NODE_ENV: "production" }), false); // next start locale
});

test("su Vercel senza configurazione GitHub la redazione si spegne", () => {
  assert.equal(keystaticChiuso({ VERCEL: "1", VERCEL_ENV: "production" }), true);
  assert.equal(keystaticChiuso({ VERCEL: "1", VERCEL_ENV: "preview" }), true);
  assert.equal(keystaticChiuso({ VERCEL_ENV: "production" }), true);
  assert.equal(keystaticChiuso({ VERCEL_URL: "cir-abc.vercel.app" }), true);
  assert.equal(keystaticChiuso({ VERCEL_REGION: "fra1" }), true);
  assert.equal(keystaticChiuso({ VERCEL: "1", NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: "" }), true);
});

test("su Vercel con la configurazione GitHub Keystatic funziona come prima", () => {
  assert.equal(keystaticChiuso({ VERCEL: "1", VERCEL_ENV: "production", ...SLUG }), false);
  assert.equal(keystaticChiuso({ VERCEL: "1", VERCEL_ENV: "preview", ...SLUG }), false);
});
