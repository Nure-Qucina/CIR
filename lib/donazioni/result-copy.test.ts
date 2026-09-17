import assert from "node:assert/strict";
import test from "node:test";
import ar from "@/messages/ar.json";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";
import it from "@/messages/it.json";

const RELIGIOUS =
  /jaz[aā]k|allahu|khayran|du['’ʿ]a\b|assalam|جزاك|জাযাক|salam alaikum/i;

const LOCALES = {
  it: it.donazioni,
  en: en.donazioni,
  ar: ar.donazioni,
  bn: bn.donazioni,
} as const;

test("result copy: one-time paid is inclusive and shows contribution placeholders", () => {
  const copy = LOCALES.it;
  assert.equal(copy.resultPaid, "Grazie per il tuo sostegno ❤️");
  assert.match(copy.resultPaidAmount, /\{amount\}/);
  assert.match(copy.resultPaidDonation, /\{amount\}/);
  assert.match(copy.resultPaidContribution, /\{amount\}/);
  assert.match(copy.resultPaidTotal, /\{amount\}/);
  assert.match(copy.resultPaidThanks, /Comunità Islamica di Roma/);
  assert.doesNotMatch(copy.resultPaid, RELIGIOUS);
  assert.doesNotMatch(copy.resultPaidAmount, /attiva/i);
});

test("result copy: monthly paid uses period suffix and active wording", () => {
  const copy = LOCALES.it;
  assert.equal(copy.resultPaid, "Grazie per il tuo sostegno ❤️");
  assert.match(copy.resultPaidMonthlyAmount, /\{amount\}/);
  assert.match(copy.resultPaidMonthlyAmount, /attiva/);
  assert.equal(copy.resultPerMonth, "/ mese");
  assert.match(copy.resultPaidThanksMonthly, /nel tempo/);
});

test("result copy: pending does not claim paid or active", () => {
  for (const copy of Object.values(LOCALES)) {
    const pending = `${copy.resultPendingTitle} ${copy.resultPendingBody} ${copy.resultPendingDelay}`;
    assert.doesNotMatch(pending, RELIGIOUS);
    assert.doesNotMatch(
      pending,
      /ricevuta con successo|payment completed|subscription active|è attiva|is active|أصبح نشط/i,
    );
    assert.match(copy.resultPendingDelay, /.{8,}/);
  }
  assert.match(LOCALES.it.resultPendingBody, /autorizzazione al pagamento/);
  assert.doesNotMatch(LOCALES.it.resultPendingBody, /prelievo SEPA/);
});

test("result copy: unpaid is retry-friendly and has no Stripe ids", () => {
  for (const copy of Object.values(LOCALES)) {
    const unpaid = `${copy.resultUnpaidTitle} ${copy.resultUnpaidBody}`;
    assert.doesNotMatch(unpaid, RELIGIOUS);
    assert.doesNotMatch(unpaid, /cs_|cus_|sub_|pi_|sk_|whsec_/);
    assert.match(copy.resultUnpaidBody, /.{12,}/);
  }
  assert.equal(LOCALES.it.resultUnpaidTitle, "Pagamento non completato");
});

test("result copy: it/en/ar/bn have no religious success formula", () => {
  assert.equal(LOCALES.en.resultPaid, "Thank you for your support ❤️");
  for (const [locale, copy] of Object.entries(LOCALES)) {
    const blob = [
      copy.resultPaid,
      copy.resultPaidAmount,
      copy.resultPaidMonthlyAmount,
      copy.resultPaidThanks,
      copy.resultPaidThanksMonthly,
      copy.resultPendingTitle,
      copy.resultPendingBody,
      copy.resultUnpaidTitle,
      copy.resultUnpaidBody,
    ].join("\n");
    assert.doesNotMatch(blob, RELIGIOUS, locale);
    assert.doesNotMatch(blob, /\[(EN|AR|BN|IT)\]/);
    assert.ok(!("resultPaidMonthlyManage" in copy));
  }
});
