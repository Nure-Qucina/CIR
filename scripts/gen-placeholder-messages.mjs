// Genera messages/{en,ar,bn}.json come placeholder a partire da it.json
// (fonte di verità), prefissando ogni stringa con [EN]/[AR]/[BN].
// Non sono traduzioni reali: DA FORNIRE dal cliente (vedi §12 del brief i18n).
import { readFileSync, writeFileSync } from "node:fs";

const it = JSON.parse(readFileSync("messages/it.json", "utf8"));

// Chiavi tecniche (non testo): valori enum letti dal codice (es. il nome
// icona in istituzionale.valori), non vanno mai prefissate o tradotte.
const TECHNICAL_KEYS = new Set(["icona"]);

function markPlaceholder(node, prefix, key) {
  if (key && TECHNICAL_KEYS.has(key)) return node;
  if (typeof node === "string") return `[${prefix}] ${node}`;
  if (Array.isArray(node)) return node.map((n) => markPlaceholder(n, prefix));
  if (node && typeof node === "object") {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = markPlaceholder(v, prefix, k);
    return out;
  }
  return node;
}

for (const [locale, prefix] of [
  ["en", "EN"],
  ["ar", "AR"],
  ["bn", "BN"],
]) {
  const data = markPlaceholder(it, prefix);
  writeFileSync(`messages/${locale}.json`, JSON.stringify(data, null, 2) + "\n");
  console.log(`✓ messages/${locale}.json`);
}
