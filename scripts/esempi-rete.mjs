// Contenuti DI ESEMPIO per provare in locale le pagine Moschee, Sponsor e
// Professionisti. Nomi, indirizzi, sconti e foto sono inventati: NON vanno
// pubblicati. Uso:
//   node scripts/esempi-rete.mjs crea [cartella-foto]   → scrive i file
//   node scripts/esempi-rete.mjs rimuovi                → li cancella tutti
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const azione = process.argv[2];
const cartellaFoto = process.argv[3];

const moschee = [
  [
    "esempio-centro-islamico-esquilino",
    "Centro islamico Esquilino",
    "centro",
    "I",
    "Esquilino",
    true,
    41.8945,
    12.504,
    "13:15",
    ["spazio-donne"],
    ["it", "bn", "ur"],
  ],
  [
    "esempio-moschea-di-torpignattara",
    "Moschea di Torpignattara",
    "est",
    "V",
    "Torpignattara",
    true,
    41.877,
    12.537,
    "13:15",
    ["spazio-donne", "scuola-arabo"],
    ["it", "bn"],
  ],
  [
    "esempio-centro-culturale-al-nur",
    "Centro culturale Al-Nur",
    "est",
    "V",
    "Centocelle",
    true,
    41.879,
    12.559,
    "13:00",
    ["scuola-corano"],
    ["it", "ar"],
  ],
  [
    "esempio-moschea-di-tor-bella-monaca",
    "Moschea di Tor Bella Monaca",
    "est",
    "VI",
    "Tor Bella Monaca",
    true,
    41.866,
    12.625,
    "13:30",
    ["parcheggio"],
    ["ar"],
  ],
  [
    "esempio-centro-islamico-quarticciolo",
    "Centro islamico Quarticciolo",
    "est",
    "V",
    "Quarticciolo",
    false,
    41.882,
    12.552,
    "13:15",
    ["spazio-donne", "accessibile"],
    ["it", "ar"],
  ],
  [
    "esempio-moschea-della-magliana",
    "Moschea della Magliana",
    "sud",
    "XI",
    "Magliana",
    true,
    41.84,
    12.425,
    "13:00",
    ["scuola-corano"],
    ["it", "ar"],
  ],
  [
    "esempio-centro-culturale-tufello",
    "Centro culturale Tufello",
    "nord",
    "III",
    "Tufello",
    true,
    41.948,
    12.541,
    "13:15",
    ["spazio-donne", "ragazzi"],
    ["it", "ar"],
  ],
  [
    "esempio-moschea-di-primavalle",
    "Moschea di Primavalle",
    "ovest",
    "XIV",
    "Primavalle",
    true,
    41.923,
    12.415,
    "13:30",
    ["accessibile"],
    ["it", "ar", "bn"],
  ],
];

const sponsor = [
  [
    "esempio-ristorante-cartagine",
    "Ristorante Cartagine",
    "ristorazione",
    "Cucina tunisina",
    "Centocelle",
    "Ci ha aperto le porte per le cene di comunità, ogni Ramadan.",
    "",
    1,
  ],
  [
    "esempio-mercato-arabo",
    "Mercato Arabo",
    "alimentari",
    "Prodotti halal",
    "Esquilino",
    "Prodotti halal e una bottega che conosce la comunità per nome.",
    "",
    2,
  ],
  [
    "esempio-macelleria-halal",
    "Macelleria Halal (esempio)",
    "alimentari",
    "Macelleria halal",
    "Torpignattara",
    "Filiera controllata e prezzi onesti.",
    "−10% presentandoti come CIR",
    null,
  ],
  [
    "esempio-pasticceria",
    "Pasticceria (esempio)",
    "ristorazione",
    "Pasticceria",
    "Pigneto",
    "I dolci delle nostre feste di Eid.",
    "",
    null,
  ],
  [
    "esempio-agenzia-viaggi",
    "Agenzia viaggi (esempio)",
    "servizi",
    "Viaggi, Hajj e Umrah",
    "Termini",
    "Ci affidiamo a loro per i pellegrinaggi organizzati.",
    "Assistenza gratuita per i documenti",
    null,
  ],
  [
    "esempio-libreria",
    "Libreria (esempio)",
    "servizi",
    "Libreria",
    "San Lorenzo",
    "Libri in italiano e arabo, e uno spazio per le presentazioni.",
    "",
    null,
  ],
];

const professionisti = [
  [
    "esempio-avv-leila-benali",
    "Avv. Leila Benali",
    "legale",
    "persona",
    "Diritto antidiscriminatorio",
    "Roma",
    true,
    true,
    "Ordine degli Avvocati di Roma",
    ["it", "ar", "fr"],
    "Ha seguito con noi diversi casi di discriminazione sul lavoro.",
    "−30%",
    "sulle cause per discriminazione",
    "LB",
  ],
  [
    "esempio-avv-marco-esposito",
    "Avv. Marco Esposito",
    "legale",
    "persona",
    "Lavoro, casa e permessi di soggiorno",
    "Municipio V",
    true,
    false,
    "Ordine degli Avvocati di Roma",
    ["it", "en"],
    "Chiaro, paziente, spiega ogni passaggio.",
    "Gratis",
    "la prima consulenza",
    "ME",
  ],
  [
    "esempio-avv-sara-hossain",
    "Avv. Sara Hossain",
    "legale",
    "persona",
    "Immigrazione e cittadinanza",
    "Roma",
    true,
    true,
    "Ordine degli Avvocati di Roma",
    ["it", "bn", "en"],
    "Conosce bene le pratiche per la cittadinanza.",
    "−20%",
    "sulle pratiche di cittadinanza",
    "SH",
  ],
  [
    "esempio-dott-ssa-amina-hassan",
    "Dott.ssa Amina Hassan",
    "psicologia",
    "persona",
    "Psicologa e psicoterapeuta",
    "Roma",
    true,
    true,
    "Ordine degli Psicologi del Lazio",
    ["it", "ar"],
    "Lavora nel rispetto della fede di chi segue.",
    "Gratis",
    "il primo colloquio, poi −20%",
    "AH",
  ],
  [
    "esempio-dott-rahim-uddin",
    "Dott. Rahim Uddin",
    "psicologia",
    "persona",
    "Adolescenti e famiglie",
    "Municipio VI",
    true,
    false,
    "Ordine degli Psicologi del Lazio",
    ["it", "bn"],
    "I ragazzi si fidano di lui.",
    "−25%",
    "sui percorsi familiari",
    "RU",
  ],
  [
    "esempio-dott-imran-qureshi",
    "Dott. Imran Qureshi",
    "fisco",
    "persona",
    "Consulente del lavoro: buste paga, colf e badanti",
    "",
    false,
    true,
    "Ordine dei Consulenti del Lavoro",
    ["it", "ur"],
    "Risponde anche su WhatsApp, in fretta.",
    "Gratis",
    "la prima verifica del contratto",
    "CL",
  ],
  [
    "esempio-studio-fiscale",
    "Studio fiscale (esempio)",
    "fisco",
    "azienda",
    "Commercialisti per famiglie ed enti del terzo settore",
    "Roma",
    true,
    false,
    "Ordine dei Commercialisti di Roma",
    ["it", "ar"],
    "Tiene i conti di diverse associazioni della rete.",
    "−15%",
    "su 730 e contabilità",
    null,
  ],
  [
    "esempio-agenzia-creativa",
    "Agenzia creativa (esempio)",
    "creativita",
    "azienda",
    "Siti web, social e grafica",
    "Roma",
    true,
    true,
    "Partita IVA verificata dal CIR",
    ["it", "en"],
    "Ha curato i materiali di alcuni nostri eventi.",
    "−20%",
    "per associazioni e attività della rete",
    null,
  ],
];

const scrivi = (dir, slug, data) => {
  mkdirSync(`content/${dir}`, { recursive: true });
  writeFileSync(
    `content/${dir}/${slug}.json`,
    JSON.stringify(data, null, 2) + "\n",
  );
};

if (azione === "crea") {
  for (const [
    slug,
    nome,
    zona,
    municipio,
    quartiere,
    pub,
    lat,
    lng,
    venerdi,
    servizi,
    lingue,
  ] of moschee) {
    scrivi("moschee", slug, {
      nome,
      bozza: false,
      zona,
      municipio,
      quartiere,
      indirizzo: "Via di esempio 1",
      mostraIndirizzo: pub,
      lat,
      lng,
      venerdi,
      servizi,
      lingueKhutba: lingue,
      contatti: { telefono: "06 0000 0000" },
    });
  }
  for (const [
    slug,
    nome,
    gruppo,
    tipo,
    quartiere,
    fiducia,
    vantaggio,
    ordine,
  ] of sponsor) {
    scrivi("sponsor", slug, {
      nome,
      bozza: false,
      gruppo,
      tipo,
      quartiere,
      indirizzo: "Via di esempio 1",
      foto: [],
      fiducia,
      descrizione:
        "Testo di esempio: qui lo sponsor racconta chi è, da quanto è a Roma e cosa offre.",
      orari: "Mar–Dom 9–20\nLunedì chiuso",
      vantaggio,
      contatti: {
        telefono: "06 0000 0000",
        instagram: "https://www.instagram.com/",
      },
      ...(ordine ? { ordine } : {}),
    });
  }
  for (const [
    slug,
    nome,
    area,
    tipo,
    ruolo,
    zona,
    inStudio,
    online,
    albo,
    lingue,
    perche,
    breve,
    suCosa,
    foto,
  ] of professionisti) {
    let immagine;
    if (
      foto &&
      cartellaFoto &&
      existsSync(join(cartellaFoto, `foto-${foto}.webp`))
    ) {
      mkdirSync(`public/images/professionisti/${slug}`, { recursive: true });
      copyFileSync(
        join(cartellaFoto, `foto-${foto}.webp`),
        `public/images/professionisti/${slug}/immagine.webp`,
      );
      immagine = `/images/professionisti/${slug}/immagine.webp`;
    }
    scrivi("professionisti", slug, {
      nome,
      bozza: false,
      area,
      tipo,
      ...(immagine ? { immagine } : {}),
      ruolo,
      zona,
      inStudio,
      online,
      albo,
      lingue,
      perche,
      descrizione:
        "Testo di esempio: qui il professionista racconta di cosa si occupa e come lavora.",
      agevolazione: {
        breve,
        suCosa,
        come: "Contatta lo studio\nDi' che vieni dal CIR",
      },
      contatti: {
        telefono: "06 0000 0000",
        whatsapp: "+39 333 000 0000",
        email: "esempio@example.com",
      },
    });
  }
  console.log("Esempi creati.");
} else if (azione === "rimuovi") {
  for (const [dir, lista] of [
    ["moschee", moschee],
    ["sponsor", sponsor],
    ["professionisti", professionisti],
  ]) {
    for (const [slug] of lista) {
      rmSync(`content/${dir}/${slug}.json`, { force: true });
      rmSync(`public/images/${dir}/${slug}`, { recursive: true, force: true });
    }
  }
  console.log("Esempi rimossi.");
} else {
  console.log(
    "Uso: node scripts/esempi-rete.mjs crea [cartella-foto] | rimuovi",
  );
}
