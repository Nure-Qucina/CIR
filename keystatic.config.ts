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
            url: fields.url({ label: "URL", validation: { isRequired: false } }),
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
            description: fields.text({ label: "SEO description (IT)", multiline: true }),
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
      columns: ["titolo", "dataPubblicazione"],
      schema: {
        titolo: fields.slug({
          name: { label: "Titolo" },
          slug: { label: "Slug (URL)" },
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
            description: fields.text({ label: "SEO description (IT)", multiline: true }),
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
          options: { image: { directory: "public/images/articoli/corpo", publicPath: "/images/articoli/corpo" } },
        }),
        traduzioni: fields.object(
          {
            en: fields.object(
              {
                titolo: fields.text({ label: "Titolo", validation: { isRequired: false } }),
                estratto: fields.text({ label: "Estratto", multiline: true, validation: { isRequired: false } }),
                seoTitle: fields.text({ label: "SEO title", validation: { isRequired: false } }),
                seoDescription: fields.text({ label: "SEO description", multiline: true, validation: { isRequired: false } }),
                corpo: fields.mdx.inline({ label: "Corpo articolo" }),
              },
              { label: "English" },
            ),
            ar: fields.object(
              {
                titolo: fields.text({ label: "Titolo", validation: { isRequired: false } }),
                estratto: fields.text({ label: "Estratto", multiline: true, validation: { isRequired: false } }),
                seoTitle: fields.text({ label: "SEO title", validation: { isRequired: false } }),
                seoDescription: fields.text({ label: "SEO description", multiline: true, validation: { isRequired: false } }),
                corpo: fields.mdx.inline({ label: "Corpo articolo" }),
              },
              { label: "العربية" },
            ),
            bn: fields.object(
              {
                titolo: fields.text({ label: "Titolo", validation: { isRequired: false } }),
                estratto: fields.text({ label: "Estratto", multiline: true, validation: { isRequired: false } }),
                seoTitle: fields.text({ label: "SEO title", validation: { isRequired: false } }),
                seoDescription: fields.text({ label: "SEO description", multiline: true, validation: { isRequired: false } }),
                corpo: fields.mdx.inline({ label: "Corpo articolo" }),
              },
              { label: "বাংলা" },
            ),
          },
          { label: "Traduzioni" },
        ),
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
        codiceFiscale: fields.text({
          label: "Codice Fiscale",
          description: "CF dell'associazione (mostrato nel footer e nell'informativa privacy).",
          validation: { isRequired: false },
        }),
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
