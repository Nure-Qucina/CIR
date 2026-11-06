import { test } from "node:test";
import assert from "node:assert/strict";
import { CSP_REPORT_MAX_BYTES, leggiSegnalazioni, rigaLog } from "./csp-report";

test("formato report-uri (Firefox/Safari)", () => {
  const corpo = JSON.stringify({
    "csp-report": {
      "document-uri": "https://www.comunitaislamicadiroma.it/donazioni?session_id=cs_live_SEGRETO#x",
      "violated-directive": "script-src-elem",
      "effective-directive": "script-src-elem",
      "blocked-uri": "https://js.nuovo-stripe.com/v4/stripe.js?key=pk_live_SEGRETO",
      disposition: "enforce",
    },
  });
  assert.deepEqual(leggiSegnalazioni(corpo), [
    {
      regola: "script-src-elem",
      bloccato: "https://js.nuovo-stripe.com",
      pagina: "/donazioni",
      tipo: "blocco",
    },
  ]);
});

test("formato report-to (Chrome) e osservazione su Keystatic", () => {
  const corpo = JSON.stringify([
    {
      type: "csp-violation",
      url: "https://www.comunitaislamicadiroma.it/keystatic",
      body: {
        documentURL: "https://www.comunitaislamicadiroma.it/keystatic/collection/articoli",
        effectiveDirective: "connect-src",
        blockedURL: "https://uploads.github.com/repos/x?token=SEGRETO",
        disposition: "report",
      },
    },
    { type: "deprecation", body: { id: "x" } },
  ]);
  assert.deepEqual(leggiSegnalazioni(corpo), [
    {
      regola: "connect-src",
      bloccato: "https://uploads.github.com",
      pagina: "/keystatic/collection/articoli",
      tipo: "osservazione",
    },
  ]);
});

test("niente dati sensibili nella riga registrata", () => {
  const corpo = JSON.stringify({
    "csp-report": {
      "document-uri": "https://www.comunitaislamicadiroma.it/contatti?email=mario@example.com",
      "effective-directive": "img-src",
      "blocked-uri": "https://tracker.example/pixel.gif?uid=12345",
    },
  });
  const riga = JSON.stringify(leggiSegnalazioni(corpo));
  assert.doesNotMatch(riga, /mario@example\.com|uid=|SEGRETO|\?/);
});

test("inline ed eval restano parole chiave", () => {
  const corpo = JSON.stringify({ "csp-report": { "effective-directive": "script-src-elem", "blocked-uri": "inline", "document-uri": "https://x.it/" } });
  assert.equal(leggiSegnalazioni(corpo)[0].bloccato, "inline");
});

test("le estensioni del browser vengono ignorate", () => {
  const corpo = JSON.stringify([
    { type: "csp-violation", body: { effectiveDirective: "script-src-elem", blockedURL: "chrome-extension://abcdef/inject.js", documentURL: "https://x.it/" } },
    { type: "csp-violation", body: { effectiveDirective: "style-src-elem", blockedURL: "inline", sourceFile: "moz-extension://abc/c.js", documentURL: "https://x.it/" } },
  ]);
  assert.deepEqual(leggiSegnalazioni(corpo), []);
});

test("corpi non validi, enormi o troppe voci non creano problemi", () => {
  assert.deepEqual(leggiSegnalazioni(""), []);
  assert.deepEqual(leggiSegnalazioni("non json"), []);
  assert.deepEqual(leggiSegnalazioni("x".repeat(CSP_REPORT_MAX_BYTES + 1)), []);
  assert.deepEqual(leggiSegnalazioni(JSON.stringify({ altro: 1 })), []);
  const tante = Array.from({ length: 50 }, () => ({ type: "csp-violation", body: { effectiveDirective: "img-src", blockedURL: "https://a.example/x.png", documentURL: "https://x.it/" } }));
  assert.equal(leggiSegnalazioni(JSON.stringify(tante)).length, 10);
});

test("niente righe false: a-capo e codici di controllo non passano", () => {
  const falsi = [
    { "csp-report": { "effective-directive": "img-src\n[csp]\tblocco\tscript-src\thttps://evil", "blocked-uri": "https://ok.example", "document-uri": "https://x.it/donazioni" } },
    { "csp-report": { "effective-directive": "img-src\u001b[2K\r", "blocked-uri": "https://ok.example", "document-uri": "https://x.it/" } },
  ];
  for (const f of falsi) {
    // Della regola resta solo la prima parola ("img-src"): niente riga in più.
    for (const s of leggiSegnalazioni(JSON.stringify(f))) {
      assert.equal(s.regola, "img-src");
      assert.doesNotMatch(rigaLog(s), /[\r\n\t\u001b]|\[csp\].*\[csp\]/);
    }
  }
  const valoreRotto = leggiSegnalazioni(JSON.stringify({ "csp-report": { "effective-directive": "img-src", "blocked-uri": "\nFALSO\n[csp] blocco x", "document-uri": "https://x.it/" } }));
  assert.equal(valoreRotto[0].bloccato, "non-valido");
  const relativo = leggiSegnalazioni(JSON.stringify({ "csp-report": { "effective-directive": "img-src", "blocked-uri": "/percorso?token=SEGRETO", "document-uri": "https://x.it/" } }));
  assert.equal(relativo[0].bloccato, "non-valido");
});

test("la riga di log è una sola riga ASCII e di lunghezza limitata", () => {
  const lungo = leggiSegnalazioni(JSON.stringify({ "csp-report": { "effective-directive": "img-src", "blocked-uri": "https://" + "a".repeat(3000) + ".example/x", "document-uri": "https://x.it/" + "p".repeat(3000) } }));
  const riga = rigaLog(lungo[0]);
  assert.ok(riga.length <= 300);
  assert.match(riga, /^[\x20-\x7e]+$/);
  assert.match(rigaLog({ regola: "img-src", bloccato: "https://città.it", pagina: "/notizie\u2028x", tipo: "blocco" }), /^[\x20-\x7e]+$/);
});
