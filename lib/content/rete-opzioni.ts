/**
 * Opzioni fisse delle raccolte «La rete» (Moschee, Sponsor, Professionisti).
 * Condivise tra keystatic.config.ts (menu a tendina della redazione, etichette
 * in italiano) e il sito (che traduce i valori con i messaggi `rete.*`).
 * Aggiungere un valore qui = aggiungere la sua etichetta in messages/*.json.
 */

export const ZONE_ROMA = [
  { label: "Centro (Municipio I)", value: "centro" },
  { label: "Roma Est (Municipi IV, V, VI, VII)", value: "est" },
  { label: "Roma Sud (Municipi VIII, IX, X, XI)", value: "sud" },
  { label: "Roma Nord (Municipi II, III, XV)", value: "nord" },
  { label: "Roma Ovest (Municipi XII, XIII, XIV)", value: "ovest" },
  { label: "Fuori Roma", value: "fuori" },
] as const;

export const MUNICIPI = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
].map((m) => ({ label: `Municipio ${m}`, value: m }));

export const SERVIZI_MOSCHEA = [
  { label: "Spazio donne", value: "spazio-donne" },
  { label: "Scuola di arabo", value: "scuola-arabo" },
  { label: "Scuola di Corano", value: "scuola-corano" },
  { label: "Attività per ragazzi", value: "ragazzi" },
  { label: "Parcheggio", value: "parcheggio" },
  { label: "Accessibile in carrozzina", value: "accessibile" },
] as const;

export const LINGUE = [
  { label: "Italiano", value: "it" },
  { label: "Arabo", value: "ar" },
  { label: "Bengalese", value: "bn" },
  { label: "Urdu", value: "ur" },
  { label: "Inglese", value: "en" },
  { label: "Francese", value: "fr" },
  { label: "Wolof", value: "wo" },
  { label: "Albanese", value: "sq" },
] as const;

export const GRUPPI_SPONSOR = [
  { label: "Alimentari", value: "alimentari" },
  { label: "Ristoranti e dolci", value: "ristorazione" },
  { label: "Servizi", value: "servizi" },
] as const;

export const AREE_PROFESSIONISTI = [
  { label: "Legale", value: "legale" },
  { label: "Psicologia", value: "psicologia" },
  { label: "Fisco e lavoro", value: "fisco" },
  { label: "Creatività e web", value: "creativita" },
] as const;

export type Zona = (typeof ZONE_ROMA)[number]["value"];
export type ServizioMoschea = (typeof SERVIZI_MOSCHEA)[number]["value"];
export type CodiceLingua = (typeof LINGUE)[number]["value"];
export type GruppoSponsor = (typeof GRUPPI_SPONSOR)[number]["value"];
export type AreaProfessionisti = (typeof AREE_PROFESSIONISTI)[number]["value"];
