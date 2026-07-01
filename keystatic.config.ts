import { config, collection, singleton, fields } from "@keystatic/core";

/**
 * Configurazione Keystatic — CMS git-based.
 * I contenuti vivono come file nel repo (JSON per dati, MDX per i corpi articolo),
 * editabili dall'admin `/keystatic` senza toccare codice.
 *
 * In locale: storage `local` (nessun segreto). Per i redattori non tecnici si
 * passa a `github` mode con le env in .env.local (vedi .env.example).
 */

const colore = fields.select({
  label: "Colore",
  options: [
    { label: "Teal", value: "teal" },
    { label: "Arancione", value: "orange" },
  ],
  defaultValue: "teal",
});

export default config({
  storage: { kind: "local" },
  ui: {
    brand: { name: "CIR — Redazione" },
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
          label: "Descrizione",
          multiline: true,
        }),
        colore,
      },
    }),

    eventi: collection({
      label: "Eventi",
      slugField: "titolo",
      path: "content/eventi/*",
      format: { data: "json" },
      columns: ["titolo", "dataInizio"],
      schema: {
        titolo: fields.slug({
          name: { label: "Titolo" },
          slug: { label: "Slug (URL)" },
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
            lat: fields.number({ label: "Latitudine", validation: { isRequired: false } }),
            lng: fields.number({ label: "Longitudine", validation: { isRequired: false } }),
          },
          { label: "Luogo" },
        ),
        estratto: fields.text({ label: "Estratto", multiline: true }),
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
            label: fields.text({ label: "Etichetta CTA" }),
            url: fields.url({ label: "URL", validation: { isRequired: false } }),
          },
          { label: "CTA esterna (opzionale)" },
        ),
        inEvidenza: fields.checkbox({
          label: "In evidenza",
          defaultValue: false,
        }),
        descrizione: fields.text({
          label: "Descrizione (corpo evento)",
          multiline: true,
          validation: { isRequired: false },
        }),
        seo: fields.object(
          {
            title: fields.text({ label: "SEO title" }),
            description: fields.text({ label: "SEO description", multiline: true }),
            ogImage: fields.image({
              label: "OG image",
              directory: "public/images/eventi/og",
              publicPath: "/images/eventi/og",
              validation: { isRequired: false },
            }),
          },
          { label: "SEO" },
        ),
      },
    }),

    articoli: collection({
      label: "Articoli e comunicati",
      slugField: "titolo",
      path: "content/articoli/*",
      format: { contentField: "corpo" },
      columns: ["titolo", "dataPubblicazione"],
      schema: {
        titolo: fields.slug({
          name: { label: "Titolo" },
          slug: { label: "Slug (URL)" },
        }),
        estratto: fields.text({ label: "Estratto", multiline: true }),
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
            title: fields.text({ label: "SEO title" }),
            description: fields.text({ label: "SEO description", multiline: true }),
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
          label: "Corpo articolo",
          options: { image: { directory: "public/images/articoli/corpo", publicPath: "/images/articoli/corpo" } },
        }),
      },
    }),
  },

  singletons: {
    site: singleton({
      label: "Configurazione sito",
      path: "content/site",
      format: { data: "json" },
      schema: {
        nome: fields.text({ label: "Nome", defaultValue: "Comunità Islamica di Roma" }),
        sigla: fields.text({ label: "Sigla", defaultValue: "CIR" }),
        payoff: fields.text({ label: "Payoff" }),
        descrizione: fields.text({ label: "Descrizione SEO", multiline: true }),
        labelNews: fields.text({
          label: "Etichetta sezione news",
          description: "Es. News / Articoli / Approfondimenti",
          defaultValue: "News",
        }),
        donazioniUrl: fields.url({ label: "URL donazioni (LaunchGood)" }),
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
          { label: "Social", itemLabel: (props) => props.fields.piattaforma.value },
        ),
        contatti: fields.object(
          {
            email: fields.text({ label: "Email", validation: { isRequired: false } }),
            telefono: fields.text({ label: "Telefono", validation: { isRequired: false } }),
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
