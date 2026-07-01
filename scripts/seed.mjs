// Genera i file di seed (categorie + articoli) nel formato Keystatic.
// Eseguibile: `node scripts/seed.mjs`. Idempotente (sovrascrive).
// Dati reali da §8 del brief. ⚠️ Date e autori sono PLACEHOLDER (da fornire).
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();

async function write(path, content) {
  const full = join(root, path);
  await mkdir(dirname(full), { recursive: true });
  await writeFile(full, content, "utf8");
  console.log("✓", path);
}

// ---------- Categorie ----------
const categorie = [
  {
    slug: "islam-e-media",
    nome: "Islam e Media",
    descrizione: "Narrazione, media e contrasto all'islamofobia.",
    colore: "teal",
  },
  {
    slug: "donne-nell-islam",
    nome: "Donne nell'Islam",
    descrizione: "Dignità, storia e protagonismo femminile.",
    colore: "orange",
  },
  {
    slug: "corano-e-scienza",
    nome: "Corano e Scienza",
    descrizione: "Il rapporto tra fede, conoscenza e ricerca.",
    colore: "teal",
  },
  {
    slug: "introduzione-all-islam",
    nome: "Introduzione all'Islam",
    descrizione: "Le basi, spiegate con la voce dei musulmani.",
    colore: "orange",
  },
  {
    slug: "palestina",
    nome: "Palestina",
    descrizione: "Giustizia, attualità e presa di posizione.",
    colore: "teal",
  },
];

for (const c of categorie) {
  await write(
    `content/categorie/${c.slug}.json`,
    JSON.stringify(
      { nome: c.nome, descrizione: c.descrizione, colore: c.colore },
      null,
      2,
    ) + "\n",
  );
}

// ---------- Articoli ----------
// ⚠️ dataPubblicazione e autore sono PLACEHOLDER finché il cliente non li fornisce.
const articoli = [
  {
    slug: "comunicato-stampa",
    titolo: "La conoscenza vince sulla paura: la CIR ringrazia la città",
    tipo: "comunicato",
    categoria: "islam-e-media",
    tags: ["comunicato", "islamofobia"],
    data: "2025-10-05",
    inEvidenza: true,
    estratto:
      "Un ringraziamento alla città di Roma: il dialogo e la conoscenza reciproca sono la risposta più forte alla paura e ai pregiudizi.",
  },
  {
    slug: "i-doppi-standard",
    titolo: "I doppi standard",
    tipo: "articolo",
    categoria: "islam-e-media",
    tags: ["media", "islamofobia"],
    data: "2025-09-10",
    inEvidenza: false,
    estratto:
      "Perché gli stessi fatti vengono raccontati in modo diverso a seconda di chi ne è protagonista. Una riflessione sul peso delle parole.",
  },
  {
    slug: "palestina-chi-non-prende-posizione-e-complice",
    titolo: "Palestina, chi non prende posizione è complice",
    tipo: "articolo",
    categoria: "palestina",
    tags: ["palestina", "diritti"],
    data: "2025-09-28",
    inEvidenza: true,
    estratto:
      "Davanti all'ingiustizia il silenzio non è neutralità. Una presa di posizione chiara, con rispetto e con dignità.",
  },
  {
    slug: "quale-il-tuo-scopo-una-cosa-che-richiede-riflessione",
    titolo: "Qual è il tuo scopo? Una cosa che richiede riflessione",
    tipo: "articolo",
    categoria: "introduzione-all-islam",
    tags: ["spiritualità", "riflessione"],
    data: "2025-07-15",
    inEvidenza: false,
    estratto:
      "Fermarsi a chiedersi il senso delle proprie giornate: una domanda antica che la fede aiuta a tenere viva.",
  },
  {
    slug: "fatima-al-fihriyya",
    titolo: "Fatima al-Fihriyya: la donna che fondò la prima università del mondo",
    tipo: "articolo",
    categoria: "donne-nell-islam",
    tags: ["donne", "storia", "conoscenza"],
    data: "2025-06-20",
    inEvidenza: true,
    estratto:
      "La storia di al-Qarawiyyin e della donna musulmana che, oltre mille anni fa, fondò la più antica università ancora attiva.",
  },
  {
    slug: "islam-la-religione-in-piu-rapida-crescita-al-mondo",
    titolo: "Islam: la religione in più rapida crescita al mondo",
    tipo: "articolo",
    categoria: "introduzione-all-islam",
    tags: ["dati", "demografia"],
    data: "2025-05-30",
    inEvidenza: false,
    estratto:
      "Numeri, ragioni e prospettive di una fede vissuta da oltre un miliardo di persone, oltre i luoghi comuni.",
  },
  {
    slug: "scienza-tecnologia-e-societa",
    titolo: "Scienza, tecnologia e società",
    tipo: "articolo",
    categoria: "corano-e-scienza",
    tags: ["scienza", "società"],
    data: "2025-05-12",
    inEvidenza: false,
    estratto:
      "Il rapporto tra progresso tecnologico, responsabilità e valori: come la tradizione islamica dialoga con il presente.",
  },
  {
    slug: "il-dilemma-dei-musulmani-in-italia",
    titolo: "Il dilemma dei musulmani in Italia",
    tipo: "articolo",
    categoria: "islam-e-media",
    tags: ["italia", "identità"],
    data: "2025-04-18",
    inEvidenza: false,
    estratto:
      "Tra appartenenza e cittadinanza: le sfide quotidiane di chi vive la propria fede in Italia con consapevolezza.",
  },
  {
    slug: "alla-riscoperta-della-luce-dell-islam",
    titolo: "Alla riscoperta della luce dell'Islam",
    tipo: "articolo",
    categoria: "introduzione-all-islam",
    tags: ["spiritualità", "introduzione"],
    data: "2025-03-22",
    inEvidenza: false,
    estratto:
      "Un invito a riscoprire il cuore del messaggio islamico: luce, misericordia e responsabilità verso gli altri.",
  },
  {
    slug: "il-rapporto-tra-scienza-e-religione-unarmonia-insospettata",
    titolo: "Il rapporto tra scienza e religione: un'armonia (in)aspettata",
    tipo: "articolo",
    categoria: "corano-e-scienza",
    tags: ["scienza", "fede"],
    data: "2025-02-14",
    inEvidenza: false,
    estratto:
      "Lontano dal conflitto che molti danno per scontato: come fede e conoscenza si sono nutrite a vicenda nella storia.",
  },
  {
    slug: "donne-nellislam-una-storia-di-dignita-uguaglianza-e-progresso",
    titolo: "Donne nell'Islam: una storia di dignità, uguaglianza e progresso",
    tipo: "articolo",
    categoria: "donne-nell-islam",
    tags: ["donne", "diritti", "storia"],
    data: "2025-01-30",
    inEvidenza: false,
    estratto:
      "Oltre gli stereotipi: il protagonismo delle donne musulmane tra storia, diritto e vita delle comunità.",
  },
];

function yamlEscape(s) {
  return s.replace(/"/g, '\\"');
}

for (const a of articoli) {
  const fm = [
    "---",
    `titolo: "${yamlEscape(a.titolo)}"`,
    `estratto: "${yamlEscape(a.estratto)}"`,
    `tipo: ${a.tipo}`,
    `categoria: ${a.categoria}`,
    "tags:",
    ...a.tags.map((t) => `  - ${t}`),
    `autore: Redazione CIR`,
    `dataPubblicazione: ${a.data}`,
    `inEvidenza: ${a.inEvidenza}`,
    "seo:",
    '  title: ""',
    '  description: ""',
    "---",
    "",
    a.estratto,
    "",
    "> ⚠️ Testo segnaposto. Il corpo integrale di questo articolo va migrato",
    "> dal sito attuale (comunitaislamicadiroma.it) in fase contenuti.",
    "",
  ].join("\n");
  await write(`content/articoli/${a.slug}.mdx`, fm);
}

console.log("\nSeed completato.");
