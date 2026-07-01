/**
 * Contenuti istituzionali reali (§8 del brief): mission, valori, timeline storia,
 * blocco media. Sono copy stabile, non gestita dai redattori quotidianamente —
 * vive in codice tipizzato. Testi presi alla lettera dal materiale del CIR.
 */

export const DATO_ASSOCIAZIONI = 22;

export const MISSION =
  "La Comunità Islamica di Roma (CIR) nasce dall'incontro tra giovani, famiglie, responsabili di centri e associazioni. Uniamo le forze per dare voce ai musulmani della capitale, difendere i loro diritti e costruire, insieme a tutta la città, una convivenza più giusta, serena e rispettosa.";

export type Valore = {
  titolo: string;
  testo: string;
  icona: "heart" | "users" | "hand-helping" | "messages-square";
};

export const VALORI: Valore[] = [
  {
    titolo: "Fede che diventa azione",
    icona: "heart",
    testo:
      "L'Islam, per noi, è luce e responsabilità. La preghiera, il Corano, la spiritualità ci spingono a prenderci cura delle persone e dei luoghi in cui viviamo. La nostra fede deve lasciare segni di bene, non solo parole.",
  },
  {
    titolo: "Unità senza annullare le differenze",
    icona: "users",
    testo:
      "Veniamo da storie, culture e percorsi diversi. Non vogliamo cancellare questa pluralità: vogliamo coordinarla. Nel CIR ognuno porta il proprio contributo, ma tutti remiamo nella stessa direzione.",
  },
  {
    titolo: "Servizio alla comunità e alla città",
    icona: "hand-helping",
    testo:
      "Siamo nati dalla comunità musulmana, ma il nostro sguardo è più ampio. Vogliamo essere utili ai nostri fratelli e sorelle musulmani e, allo stesso tempo, essere una presenza positiva per tutta Roma.",
  },
  {
    titolo: "Dialogo chiaro e schiena dritta",
    icona: "messages-square",
    testo:
      "Parliamo con istituzioni, media, scuole e associazioni con rispetto, ma anche con dignità. Non cerchiamo privilegi: chiediamo giustizia, riconoscimento e spazi di dialogo veri, senza nascondere chi siamo.",
  },
];

export type MomentoStoria = {
  periodo: string;
  testo: string;
};

export const STORIA: MomentoStoria[] = [
  {
    periodo: "Primavera 2025",
    testo:
      "Nella comunità musulmana di Roma cresce una domanda chiara: serve più unità, più coordinamento, più rappresentanza. Le realtà esistono, il lavoro c'è, ma manca una voce comune.",
  },
  {
    periodo: "Estate 2025",
    testo:
      "Giovani determinati e responsabili di centri e associazioni iniziano a incontrarsi con continuità: come costruire un coordinamento che sia una responsabilità condivisa, non solo un nome?",
  },
  {
    periodo: "Estate 2025",
    testo:
      "La comunità organizza insieme una grande manifestazione per la Palestina. Realtà prima separate scelgono di stare fianco a fianco: la prova che la comunità islamica di Roma può lavorare unita.",
  },
  {
    periodo: "29 settembre 2025",
    testo:
      "Dopo incontri e scelte coraggiose si decide di dare vita al progetto del CIR. L'8 gennaio il CIR nasce ufficialmente.",
  },
];

export const MEDIA = {
  perche: [
    "Contrastare narrazioni distorte e islamofobe.",
    "Mostrare volti, storie e progetti, non etichette.",
    "Essere interlocutori seri per giornalisti e istituzioni.",
    "Costruire fiducia, non paura.",
  ],
  cosa: [
    "Comunicati e prese di posizione.",
    "Interviste e interventi pubblici.",
    "Supporto ai giornalisti.",
    "Campagne di sensibilizzazione.",
    "Racconto delle iniziative del CIR.",
  ],
};

/** Testo "Chi siamo" esteso, dal materiale §8.4. */
export const CHI_SIAMO_INTRO =
  "Siamo una realtà che oggi rappresenta 22 associazioni islamiche attive sul territorio romano, un numero in continua crescita. Non siamo un progetto temporaneo né un'iniziativa simbolica: siamo una struttura organizzata, una rete solida e una voce unitaria.";

export const CHI_SIAMO_PUNTI = [
  "Una rete di associazioni che mette in comune esperienze, energie e competenze.",
  "Un coordinamento che trasforma la collaborazione in responsabilità condivisa.",
  "Una rappresentanza che dà ai musulmani di Roma una voce credibile e riconoscibile.",
  "Un impegno a contrastare l'islamofobia con intelligenza e fermezza.",
  "Un Islam consapevole, in dialogo aperto con istituzioni, scuole e cittadini.",
  "Eventi e progetti sociali al servizio della comunità e dell'intera città.",
];
