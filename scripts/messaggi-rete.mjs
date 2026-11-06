// Aggiunge (o aggiorna) i testi della sezione «La rete» in messages/*.json.
// Uso: node scripts/messaggi-rete.mjs — idempotente, tocca solo nav.* nuovi e rete.*
import { readFileSync, writeFileSync } from "node:fs";

const T = JSON.parse(
  readFileSync(new URL("./messaggi-rete.json", import.meta.url), "utf8"),
);

for (const locale of ["it", "en", "ar", "bn"]) {
  const file = `messages/${locale}.json`;
  const data = JSON.parse(readFileSync(file, "utf8"));
  Object.assign(data.nav, T[locale].nav);
  data.rete = T[locale].rete;
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`✓ ${file}`);
}
