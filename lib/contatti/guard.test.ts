import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_LIMITS,
  contactFromAddress,
  isEmail,
  pulisciNome,
  validaContatto,
} from "./guard";

test("pulisciNome toglie a-capo e caratteri di controllo dall'oggetto", () => {
  assert.equal(pulisciNome("Mario\r\nBcc: x@evil.example"), "Mario Bcc: x@evil.example");
  assert.equal(pulisciNome("  Anna \t  Rossi\u2028 "), "Anna Rossi");
  assert.equal(pulisciNome("محمد علي"), "محمد علي");
  assert.equal(pulisciNome("Mario\u202Eignoro"), "Marioignoro");
  assert.doesNotMatch(pulisciNome("\u2066x\u2069\u200F"), /[\u2066\u2069\u200F]/);
  assert.doesNotMatch(pulisciNome("a\nb\rc\u0000d"), /[\r\n\u0000]/);
});

test("validaContatto: messaggio normale passa", () => {
  assert.deepEqual(
    validaContatto({
      nome: "Mario Rossi",
      email: "mario@example.com",
      messaggio: "Buongiorno, vorrei informazioni sull'evento.",
    }),
    {},
  );
});

test("validaContatto: limiti minimi e massimi", () => {
  const base = { nome: "Mario", email: "m@example.com", messaggio: "x".repeat(20) };
  assert.equal(validaContatto({ ...base, nome: "M" }).nome, "erroreNome");
  assert.equal(
    validaContatto({ ...base, nome: "M".repeat(CONTACT_LIMITS.nomeMax + 1) }).nome,
    "erroreNomeLungo",
  );
  assert.equal(validaContatto({ ...base, nome: "M".repeat(CONTACT_LIMITS.nomeMax) }).nome, undefined);
  assert.equal(validaContatto({ ...base, messaggio: "corto" }).messaggio, "erroreMessaggio");
  assert.equal(
    validaContatto({ ...base, messaggio: "x".repeat(CONTACT_LIMITS.messaggioMax + 1) }).messaggio,
    "erroreMessaggioLungo",
  );
  assert.equal(
    validaContatto({ ...base, messaggio: "x".repeat(CONTACT_LIMITS.messaggioMax) }).messaggio,
    undefined,
  );
});

test("isEmail rifiuta indirizzi malformati o troppo lunghi", () => {
  assert.ok(isEmail("a@b.it"));
  assert.ok(!isEmail("a@b"));
  assert.ok(!isEmail("a b@c.it"));
  assert.ok(!isEmail(`${"a".repeat(250)}@b.it`));
  assert.ok(!isEmail("a<b>@c.it"));
  assert.ok(!isEmail("a@c.it,d@e.it"));
  assert.ok(!isEmail("a\u0000@c.it"));
});

test("contactFromAddress usa CONTACT_FORM_FROM, poi DONATION_EMAIL_FROM", () => {
  assert.equal(
    contactFromAddress({ CONTACT_FORM_FROM: "contatti@cir.example", DONATION_EMAIL_FROM: "CIR <donazioni@cir.example>" }, true),
    "Sito CIR <contatti@cir.example>",
  );
  assert.equal(
    contactFromAddress({ DONATION_EMAIL_FROM: "CIR Donazioni <donazioni@cir.example>" }, true),
    "Sito CIR <donazioni@cir.example>",
  );
  assert.equal(
    contactFromAddress({ DONATION_EMAIL_FROM: "donazioni@cir.example" }, true),
    "Sito CIR <donazioni@cir.example>",
  );
});

test("contactFromAddress: in produzione niente mittente di prova", () => {
  assert.equal(contactFromAddress({}, true), null);
  assert.equal(contactFromAddress({ DONATION_EMAIL_FROM: "non-un-indirizzo" }, true), null);
  assert.equal(contactFromAddress({}, false), "Sito CIR <onboarding@resend.dev>");
});
