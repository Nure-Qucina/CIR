import { config, collection, singleton, fields } from "@keystatic/core";
import {
  ZONE_ROMA as ZONE,
  MUNICIPI,
  SERVIZI_MOSCHEA as SERVIZI,
  LINGUE as LINGUE_RO,
  GRUPPI_SPONSOR as GRUPPI,
  AREE_PROFESSIONISTI as AREE,
} from "./lib/content/rete-opzioni";

// Keystatic vuole array mutabili: copie delle opzioni condivise col sito.
const ZONE_ROMA = ZONE.map((o) => ({ ...o }));
const SERVIZI_MOSCHEA = SERVIZI.map((o) => ({ ...o }));
const LINGUE = LINGUE_RO.map((o) => ({ ...o }));
const GRUPPI_SPONSOR = GRUPPI.map((o) => ({ ...o }));
const AREE_PROFESSIONISTI = AREE.map((o) => ({ ...o }));

/**
 * Configurazione Keystatic — CMS git-based.
 * I contenuti vivono come file nel repo (JSON per dati, MDX per i corpi articolo),
 * editabili dall'admin `/keystatic` senza toccare codice.
 *
 * Storage (scelto in base alla presenza dei segreti GitHub, NON a NODE_ENV:
 * così il build non si rompe mai dove i segreti non ci sono — es. build
 * locale/CI — e github mode si attiva da solo appena le env sono impostate
 * su Vercel):
 *  - senza `KEYSTATIC_GITHUB_CLIENT_ID` → "local": scrive i file su disco,
 *    nessun segreto richiesto (sviluppo con `pnpm dev`).
 *  - con i segreti GitHub presenti → "github": i redattori accedono a
 *    /keystatic col proprio account GitHub e i salvataggi diventano commit
 *    sul repo, che fanno ri-deployare automaticamente il sito. Richiede una
 *    GitHub App + le 4 env `KEYSTATIC_GITHUB_*` / `KEYSTATIC_SECRET` /
 *    `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` (vedi .env.example e README).
 *    ⚠️ In github mode il build FALLISCE se mancano CLIENT_ID/SECRET/SECRET:
 *    impostare tutte e 4 le env su Vercel PRIMA del primo deploy.
 *
 * NB: il sito pubblico legge sempre i file locali del bundle (createReader),
 * quindi lo storage mode non incide su build/SSG/ISR — solo sull'editing.
 *
 * ⚠️ Se il repo cambia (es. si sposta nell'org del CIR), aggiornare `repo`.
 */
// Esportato: usato anche da /admin/bozze per committare via API GitHub.
export const KEYSTATIC_REPO = { owner: "Nure-Qucina", name: "CIR" } as const;
const USE_GITHUB_STORAGE = Boolean(
  process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG,
);

const colore = fields.select({
  label: "Colore",
  options: [
    { label: "Teal", value: "teal" },
    { label: "Arancione", value: "orange" },
  ],
  defaultValue: "teal",
});

/**
 * Traduzioni opzionali (EN/AR/BN) di un set di campi testuali. L'italiano
 * NON è qui: resta nei campi principali della collection, invariati — così
 * i contenuti esistenti non vanno migrati e restano garantiti identici.
 * Se un campo tradotto è vuoto, il resolver mostra il fallback IT + badge
 * "Disponibile in italiano" (§5-6 del brief i18n).
 *
 * `makeShape` è una factory (non un oggetto condiviso): ogni lingua ottiene
 * la propria istanza dei campi.
 */
function traduzioni<T extends Record<string, ReturnType<typeof fields.text>>>(
  makeShape: () => T,
) {
  return fields.object(
    {
      en: fields.object(makeShape(), { label: "English" }),
      ar: fields.object(makeShape(), { label: "العربية" }),
      bn: fields.object(makeShape(), { label: "বাংলা" }),
    },
    { label: "Traduzioni" },
  );
}

export default config({
  storage: USE_GITHUB_STORAGE
    ? { kind: "github", repo: KEYSTATIC_REPO }
    : { kind: "local" },
  ui: {
    brand: { name: "CIR — Redazione" },
    navigation: {
      Contenuti: ["articoli", "eventi", "categorie"],
      "La rete": ["moschee", "sponsor", "professionisti"],
      Impostazioni: ["site"],
    },
  },
  collections: {
    categorie: collection({
      label: "Categorie",
      slugField: "nome",
      path: "content/categorie/*",
      format: { data: "json" },
      entryLayout: "form",
      schema: {
        nome: fields.slug({
          name: { label: "Nome categoria" },
          slug: {
            label: "Slug (URL)",
            description: "Usato negli indirizzi: /news/categoria/<slug>",
          },
        }),
        descrizione: fields.text({
          label: "Descrizione (IT)",
          multiline: true,
        }),
        colore,
        traduzioni: traduzioni(() => ({
          nome: fields.text({
            label: "Nome categoria",
            validation: { isRequired: false },
          }),
          descrizione: fields.text({
            label: "Descrizione",
            multiline: true,
            validation: { isRequired: false },
          }),
        })),
      },
    }),

    eventi: collection({
      label: "Eventi",
      slugField: "titolo",
      path: "content/eventi/*",
      format: { data: "json" },
      columns: ["titolo", "dataInizio", "bozza"],
      schema: {
        titolo: fields.slug({
          name: { label: "Titolo" },
          slug: { label: "Slug (URL)" },
        }),
        // Sistema bozze: un evento in bozza NON è visibile sul sito pubblico
        // (né in elenco, né via link diretto, né in sitemap) ma resta
        // modificabile da Keystatic. I contenuti esistenti senza il campo
        // risultano automaticamente pubblicati (default false).
        bozza: fields.checkbox({
          label: "Bozza (nascosto dal sito)",
          description:
            "Se attivo, l'evento non appare sul sito pubblico — né in elenco né via link diretto. Usalo per lavori in corso o per nascondere senza eliminare.",
          defaultValue: false,
        }),
        stato: fields.select({
          label: "Stato",
          description:
            "Indicativo: il badge In programma/Concluso è ricalcolato dalle date.",
          options: [
            { label: "Programmato", value: "programmato" },
            { label: "Passato", value: "passato" },
          ],
          defaultValue: "programmato",
        }),
        dataInizio: fields.datetime({ label: "Data e ora inizio" }),
        dataFine: fields.datetime({
          label: "Data e ora fine",
          description: "Lascia vuoto se non applicabile.",
        }),
        tuttoIlGiorno: fields.checkbox({
          label: "Tutto il giorno",
          defaultValue: false,
        }),
        luogo: fields.object(
          {
            nome: fields.text({ label: "Nome luogo" }),
            indirizzo: fields.text({ label: "Indirizzo" }),
            citta: fields.text({ label: "Città", defaultValue: "Roma" }),
            lat: fields.number({
              label: "Latitudine",
              validation: { isRequired: false },
            }),
            lng: fields.number({
              label: "Longitudine",
              validation: { isRequired: false },
            }),
          },
          { label: "Luogo" },
        ),
        estratto: fields.text({ label: "Estratto (IT)", multiline: true }),
        copertina: fields.image({
          label: "Copertina",
          directory: "public/images/eventi",
          publicPath: "/images/eventi",
          validation: { isRequired: false },
        }),
        categoria: fields.relationship({
          label: "Categoria",
          collection: "categorie",
          validation: { isRequired: false },
        }),
        ctaEsterna: fields.object(
          {
            label: fields.text({ label: "Etichetta CTA (IT)" }),
            url: fields.url({
              label: "URL",
              validation: { isRequired: false },
            }),
          },
          { label: "CTA esterna (opzionale)" },
        ),
        inEvidenza: fields.checkbox({
          label: "In evidenza",
          defaultValue: false,
        }),
        descrizione: fields.text({
          label: "Descrizione (corpo evento, IT)",
          multiline: true,
          validation: { isRequired: false },
        }),
        seo: fields.object(
          {
            title: fields.text({ label: "SEO title (IT)" }),
            description: fields.text({
              label: "SEO description (IT)",
              multiline: true,
            }),
            ogImage: fields.image({
              label: "OG image",
              directory: "public/images/eventi/og",
              publicPath: "/images/eventi/og",
              validation: { isRequired: false },
            }),
          },
          { label: "SEO" },
        ),
        traduzioni: traduzioni(() => ({
          titolo: fields.text({
            label: "Titolo",
            validation: { isRequired: false },
          }),
          estratto: fields.text({
            label: "Estratto",
            multiline: true,
            validation: { isRequired: false },
          }),
          descrizione: fields.text({
            label: "Descrizione (corpo evento)",
            multiline: true,
            validation: { isRequired: false },
          }),
          ctaLabel: fields.text({
            label: "Etichetta CTA",
            validation: { isRequired: false },
          }),
          seoTitle: fields.text({
            label: "SEO title",
            validation: { isRequired: false },
          }),
          seoDescription: fields.text({
            label: "SEO description",
            multiline: true,
            validation: { isRequired: false },
          }),
        })),
      },
    }),

    articoli: collection({
      label: "Articoli e comunicati",
      slugField: "titolo",
      path: "content/articoli/*",
      format: { contentField: "corpo" },
      columns: ["titolo", "dataPubblicazione", "bozza"],
      schema: {
        titolo: fields.slug({
          name: { label: "Titolo" },
          slug: { label: "Slug (URL)" },
        }),
        // Sistema bozze — vedi commento sulla collection eventi.
        bozza: fields.checkbox({
          label: "Bozza (nascosto dal sito)",
          description:
            "Se attivo, l'articolo non appare sul sito pubblico — né in elenco né via link diretto. Usalo per gli articoli in attesa di approvazione o per nascondere senza eliminare.",
          defaultValue: false,
        }),
        estratto: fields.text({ label: "Estratto (IT)", multiline: true }),
        tipo: fields.select({
          label: "Tipo",
          options: [
            { label: "Articolo", value: "articolo" },
            { label: "Comunicato stampa", value: "comunicato" },
          ],
          defaultValue: "articolo",
        }),
        categoria: fields.relationship({
          label: "Categoria",
          collection: "categorie",
          validation: { isRequired: false },
        }),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Tag",
          itemLabel: (props) => props.value,
        }),
        autore: fields.text({ label: "Autore", defaultValue: "Redazione CIR" }),
        dataPubblicazione: fields.date({ label: "Data pubblicazione" }),
        dataModifica: fields.date({
          label: "Data modifica",
          validation: { isRequired: false },
        }),
        copertina: fields.image({
          label: "Copertina",
          directory: "public/images/articoli",
          publicPath: "/images/articoli",
          validation: { isRequired: false },
        }),
        tempoLettura: fields.number({
          label: "Tempo di lettura (min)",
          description: "Lascia vuoto: calcolato dal corpo.",
          validation: { isRequired: false },
        }),
        inEvidenza: fields.checkbox({
          label: "In evidenza",
          defaultValue: false,
        }),
        seo: fields.object(
          {
            title: fields.text({ label: "SEO title (IT)" }),
            description: fields.text({
              label: "SEO description (IT)",
              multiline: true,
            }),
            ogImage: fields.image({
              label: "OG image",
              directory: "public/images/articoli/og",
              publicPath: "/images/articoli/og",
              validation: { isRequired: false },
            }),
          },
          { label: "SEO" },
        ),
        corpo: fields.mdx({
          label: "Corpo articolo (IT)",
          options: {
            image: {
              directory: "public/images/articoli/corpo",
              publicPath: "/images/articoli/corpo",
            },
          },
        }),
        traduzioni: fields.object(
          {
            en: fields.object(
              {
                titolo: fields.text({
                  label: "Titolo",
                  validation: { isRequired: false },
                }),
                estratto: fields.text({
                  label: "Estratto",
                  multiline: true,
                  validation: { isRequired: false },
                }),
                seoTitle: fields.text({
                  label: "SEO title",
                  validation: { isRequired: false },
                }),
                seoDescription: fields.text({
                  label: "SEO description",
                  multiline: true,
                  validation: { isRequired: false },
                }),
                corpo: fields.mdx.inline({ label: "Corpo articolo" }),
              },
              { label: "English" },
            ),
            ar: fields.object(
              {
                titolo: fields.text({
                  label: "Titolo",
                  validation: { isRequired: false },
                }),
                estratto: fields.text({
                  label: "Estratto",
                  multiline: true,
                  validation: { isRequired: false },
                }),
                seoTitle: fields.text({
                  label: "SEO title",
                  validation: { isRequired: false },
                }),
                seoDescription: fields.text({
                  label: "SEO description",
                  multiline: true,
                  validation: { isRequired: false },
                }),
                corpo: fields.mdx.inline({ label: "Corpo articolo" }),
              },
              { label: "العربية" },
            ),
            bn: fields.object(
              {
                titolo: fields.text({
                  label: "Titolo",
                  validation: { isRequired: false },
                }),
                estratto: fields.text({
                  label: "Estratto",
                  multiline: true,
                  validation: { isRequired: false },
                }),
                seoTitle: fields.text({
                  label: "SEO title",
                  validation: { isRequired: false },
                }),
                seoDescription: fields.text({
                  label: "SEO description",
                  multiline: true,
                  validation: { isRequired: false },
                }),
                corpo: fields.mdx.inline({ label: "Corpo articolo" }),
              },
              { label: "বাংলা" },
            ),
          },
          { label: "Traduzioni" },
        ),
      },
    }),

    // ─── La rete: Moschee, Sponsor, Professionisti ─────────────────────────
    // Stesso schema delle altre raccolte: spunta Bozza in cima, campi IT
    // principali, traduzioni EN/AR/BN facoltative (fallback all'italiano).

    moschee: collection({
      label: "Moschee",
      slugField: "nome",
      path: "content/moschee/*",
      format: { data: "json" },
      columns: ["nome", "zona", "bozza"],
      schema: {
        nome: fields.slug({
          name: { label: "Nome della moschea o del centro" },
          slug: { label: "Slug (URL)" },
        }),
        bozza: fields.checkbox({
          label: "Bozza (nascosta dal sito)",
          description:
            "Se attivo, la moschea non compare sul sito né sulla mappa. Usalo finché i dati non sono confermati.",
          defaultValue: false,
        }),
        associazione: fields.text({
          label: "Associazione di riferimento",
          description: "Facoltativo. Es. «Associazione Al-Nur».",
          validation: { isRequired: false },
        }),
        zona: fields.select({
          label: "Zona",
          description: "Raggruppa l'elenco e i filtri della pagina.",
          options: ZONE_ROMA,
          defaultValue: "est",
        }),
        municipio: fields.select({
          label: "Municipio",
          options: MUNICIPI,
          defaultValue: "V",
        }),
        quartiere: fields.text({
          label: "Quartiere",
          description:
            "Es. Torpignattara. Si vede sempre, anche se l'indirizzo è nascosto.",
          validation: { isRequired: false },
        }),
        indirizzo: fields.text({
          label: "Indirizzo",
          description: "Es. Via Roma 12. Il CAP non serve.",
          validation: { isRequired: false },
        }),
        mostraIndirizzo: fields.checkbox({
          label: "Mostra l'indirizzo sul sito",
          description:
            "Se spento, il sito mostra solo quartiere e municipio, e niente punto preciso sulla mappa. Chiedi sempre il permesso alla moschea.",
          defaultValue: false,
        }),
        lat: fields.number({
          label: "Latitudine",
          description:
            "Per la mappa. Su Google Maps: tasto destro sul punto, il primo numero copiato.",
          validation: { isRequired: false },
        }),
        lng: fields.number({
          label: "Longitudine",
          description: "Il secondo numero copiato da Google Maps.",
          validation: { isRequired: false },
        }),
        venerdi: fields.text({
          label: "Orario della preghiera del venerdì",
          description:
            "Es. 13:15. Se cambia d'estate scrivi «13:15 (estate 13:30)».",
          validation: { isRequired: false },
        }),
        servizi: fields.multiselect({
          label: "Servizi",
          options: SERVIZI_MOSCHEA,
          defaultValue: [],
        }),
        lingueKhutba: fields.multiselect({
          label: "Lingue della khutba",
          options: LINGUE,
          defaultValue: ["it", "ar"],
        }),
        foto: fields.image({
          label: "Foto",
          description: "Facoltativa.",
          directory: "public/images/moschee",
          publicPath: "/images/moschee",
          validation: { isRequired: false },
        }),
        contatti: fields.object(
          {
            telefono: fields.text({
              label: "Telefono",
              validation: { isRequired: false },
            }),
            email: fields.text({
              label: "Email",
              validation: { isRequired: false },
            }),
            sito: fields.url({
              label: "Sito o pagina social",
              validation: { isRequired: false },
            }),
          },
          { label: "Contatti (facoltativi)" },
        ),
      },
    }),

    sponsor: collection({
      label: "Sponsor",
      slugField: "nome",
      path: "content/sponsor/*",
      format: { data: "json" },
      columns: ["nome", "gruppo", "bozza"],
      schema: {
        nome: fields.slug({
          name: { label: "Nome dell'attività" },
          slug: {
            label: "Slug (URL)",
            description: "Indirizzo: /sponsor/<slug>",
          },
        }),
        bozza: fields.checkbox({
          label: "Bozza (nascosto dal sito)",
          description: "Se attivo, lo sponsor non compare sul sito.",
          defaultValue: false,
        }),
        gruppo: fields.select({
          label: "Categoria",
          description: "Per i filtri della pagina Sponsor.",
          options: GRUPPI_SPONSOR,
          defaultValue: "alimentari",
        }),
        tipo: fields.text({
          label: "Che attività è (IT)",
          description: "Breve. Es. «Cucina tunisina», «Macelleria halal».",
        }),
        quartiere: fields.text({
          label: "Quartiere",
          validation: { isRequired: false },
        }),
        indirizzo: fields.text({
          label: "Indirizzo",
          validation: { isRequired: false },
        }),
        logo: fields.image({
          label: "Logo",
          description: "Quadrato, meglio se su sfondo chiaro.",
          directory: "public/images/sponsor",
          publicPath: "/images/sponsor",
          validation: { isRequired: false },
        }),
        foto: fields.array(
          fields.image({
            label: "Foto",
            directory: "public/images/sponsor",
            publicPath: "/images/sponsor",
          }),
          {
            label: "Foto del locale",
            description: "Da 1 a 6. La prima è quella della card.",
            validation: { length: { max: 6 } },
          },
        ),
        fiducia: fields.text({
          label: "Perché ci fidiamo (IT)",
          description: "Una o due frasi, scritte dal CIR.",
          multiline: true,
        }),
        descrizione: fields.text({
          label: "Presentazione (IT)",
          description: "Scritta dallo sponsor: chi sono, cosa offrono.",
          multiline: true,
          validation: { isRequired: false },
        }),
        orari: fields.text({
          label: "Orari (IT)",
          description: "Es. «Mar–Dom 12–15 e 19–23\nLunedì chiuso».",
          multiline: true,
          validation: { isRequired: false },
        }),
        vantaggio: fields.text({
          label: "Vantaggio per la comunità (IT)",
          description: "Facoltativo. Es. «−10% presentandoti come CIR».",
          validation: { isRequired: false },
        }),
        contatti: fields.object(
          {
            telefono: fields.text({
              label: "Telefono",
              validation: { isRequired: false },
            }),
            sito: fields.url({
              label: "Sito",
              validation: { isRequired: false },
            }),
            instagram: fields.url({
              label: "Instagram",
              validation: { isRequired: false },
            }),
            facebook: fields.url({
              label: "Facebook",
              validation: { isRequired: false },
            }),
          },
          { label: "Contatti" },
        ),
        ordine: fields.integer({
          label: "Ordine",
          description:
            "Facoltativo. I numeri più bassi vengono prima; a parità, ordine alfabetico.",
          validation: { isRequired: false },
        }),
        traduzioni: traduzioni(() => ({
          tipo: fields.text({
            label: "Che attività è",
            validation: { isRequired: false },
          }),
          fiducia: fields.text({
            label: "Perché ci fidiamo",
            multiline: true,
            validation: { isRequired: false },
          }),
          descrizione: fields.text({
            label: "Presentazione",
            multiline: true,
            validation: { isRequired: false },
          }),
          orari: fields.text({
            label: "Orari",
            multiline: true,
            validation: { isRequired: false },
          }),
          vantaggio: fields.text({
            label: "Vantaggio per la comunità",
            validation: { isRequired: false },
          }),
        })),
      },
    }),

    professionisti: collection({
      label: "Professionisti",
      slugField: "nome",
      path: "content/professionisti/*",
      format: { data: "json" },
      columns: ["nome", "area", "bozza"],
      schema: {
        nome: fields.slug({
          name: {
            label: "Nome o studio",
            description: "Es. «Avv. Leila Benali».",
          },
          slug: {
            label: "Slug (URL)",
            description: "Indirizzo: /professionisti/<slug>",
          },
        }),
        bozza: fields.checkbox({
          label: "Bozza (nascosto dal sito)",
          description: "Se attivo, il professionista non compare sul sito.",
          defaultValue: false,
        }),
        area: fields.select({
          label: "Area",
          options: AREE_PROFESSIONISTI,
          defaultValue: "legale",
        }),
        tipo: fields.select({
          label: "Persona o azienda",
          description:
            "Per le persone si mostra la foto, per le aziende il logo.",
          options: [
            { label: "Persona", value: "persona" },
            { label: "Azienda o studio", value: "azienda" },
          ],
          defaultValue: "persona",
        }),
        immagine: fields.image({
          label: "Foto (persona) o logo (azienda)",
          description:
            "Foto: viso ben visibile, sfondo semplice. Si ritaglia in tondo.",
          directory: "public/images/professionisti",
          publicPath: "/images/professionisti",
          validation: { isRequired: false },
        }),
        ruolo: fields.text({
          label: "Di cosa si occupa, in breve (IT)",
          description: "Es. «Diritto antidiscriminatorio».",
        }),
        zona: fields.text({
          label: "Zona",
          description: "Es. «Municipio V» o «Roma».",
          validation: { isRequired: false },
        }),
        inStudio: fields.checkbox({
          label: "Riceve in studio",
          defaultValue: true,
        }),
        online: fields.checkbox({ label: "Anche online", defaultValue: false }),
        albo: fields.text({
          label: "Iscrizione all'albo",
          description:
            "Es. «Ordine degli Avvocati di Roma, n. 12345». Per le aziende: «Partita IVA verificata dal CIR».",
          validation: { isRequired: false },
        }),
        lingue: fields.multiselect({
          label: "Lingue parlate",
          options: LINGUE,
          defaultValue: ["it"],
        }),
        perche: fields.text({
          label: "Perché lo consigliamo (IT)",
          description: "Una frase, scritta dal CIR.",
          multiline: true,
        }),
        descrizione: fields.text({
          label: "Presentazione (IT)",
          description:
            "Scritta dal professionista: di cosa si occupa, come lavora.",
          multiline: true,
          validation: { isRequired: false },
        }),
        agevolazione: fields.object(
          {
            breve: fields.text({
              label: "In breve",
              description:
                "Il testo grande del tagliando. Es. «−30%» o «Gratis».",
            }),
            suCosa: fields.text({
              label: "Su cosa (IT)",
              description: "Es. «sulle cause per discriminazione».",
            }),
            come: fields.text({
              label: "Come ottenerla (IT)",
              description: "Un passo per riga.",
              multiline: true,
              defaultValue: "Contatta lo studio\nDi' che vieni dal CIR",
            }),
            validaFino: fields.date({
              label: "Valida fino al",
              description:
                "Facoltativo. Dopo questa data il tagliando sparisce da solo.",
              validation: { isRequired: false },
            }),
          },
          { label: "Agevolazione per la comunità" },
        ),
        contatti: fields.object(
          {
            telefono: fields.text({
              label: "Telefono",
              validation: { isRequired: false },
            }),
            whatsapp: fields.text({
              label: "WhatsApp",
              description: "Numero con prefisso, es. +39 333 1234567.",
              validation: { isRequired: false },
            }),
            email: fields.text({
              label: "Email",
              validation: { isRequired: false },
            }),
            sito: fields.url({
              label: "Sito",
              validation: { isRequired: false },
            }),
            indirizzo: fields.text({
              label: "Indirizzo dello studio",
              validation: { isRequired: false },
            }),
          },
          { label: "Contatti" },
        ),
        traduzioni: traduzioni(() => ({
          ruolo: fields.text({
            label: "Di cosa si occupa",
            validation: { isRequired: false },
          }),
          perche: fields.text({
            label: "Perché lo consigliamo",
            multiline: true,
            validation: { isRequired: false },
          }),
          descrizione: fields.text({
            label: "Presentazione",
            multiline: true,
            validation: { isRequired: false },
          }),
          suCosa: fields.text({
            label: "Agevolazione: su cosa",
            validation: { isRequired: false },
          }),
          come: fields.text({
            label: "Agevolazione: come ottenerla",
            multiline: true,
            validation: { isRequired: false },
          }),
        })),
      },
    }),
  },

  singletons: {
    site: singleton({
      label: "Configurazione sito",
      path: "content/site",
      format: { data: "json" },
      schema: {
        nome: fields.text({
          label: "Nome",
          defaultValue: "Comunità Islamica di Roma",
        }),
        sigla: fields.text({ label: "Sigla", defaultValue: "CIR" }),
        codiceFiscale: fields.text({
          label: "Codice Fiscale",
          description:
            "CF dell'associazione (mostrato nel footer e nell'informativa privacy).",
          validation: { isRequired: false },
        }),
        reteVisibile: fields.checkbox({
          label: "Mostra «La rete» sul sito",
          description:
            "Moschee, Sponsor e Professionisti. Finché è spenta le sezioni non compaiono nel menu, nel footer e su Google: si aprono solo con il link diretto, per controllare i contenuti prima di pubblicarli.",
          defaultValue: false,
        }),
        payoff: fields.text({ label: "Payoff" }),
        descrizione: fields.text({ label: "Descrizione SEO", multiline: true }),
        labelNews: fields.text({
          label: "Etichetta sezione news",
          description: "Es. News / Articoli / Approfondimenti",
          defaultValue: "News",
        }),
        donazioniUrl: fields.url({
          label: "URL campagna donazioni esterna (legacy)",
          description:
            "URL legacy della campagna esterna. Non controlla i pulsanti Dona del sito, che puntano alla pagina interna /donazioni.",
        }),
        social: fields.array(
          fields.object({
            piattaforma: fields.select({
              label: "Piattaforma",
              options: [
                { label: "Facebook", value: "facebook" },
                { label: "Instagram", value: "instagram" },
              ],
              defaultValue: "instagram",
            }),
            url: fields.url({ label: "URL" }),
          }),
          {
            label: "Social",
            itemLabel: (props) => props.fields.piattaforma.value,
          },
        ),
        contatti: fields.object(
          {
            email: fields.text({
              label: "Email",
              validation: { isRequired: false },
            }),
            telefono: fields.text({
              label: "Telefono",
              validation: { isRequired: false },
            }),
            indirizzo: fields.text({
              label: "Indirizzo sede",
              multiline: true,
              validation: { isRequired: false },
            }),
          },
          {
            label: "Contatti",
            description:
              "⚠️ DA FORNIRE dal cliente. Finché vuoti, il sito mostra un avviso, mai dati finti.",
          },
        ),
      },
    }),
  },
});
