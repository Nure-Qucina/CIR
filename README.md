# Comunità Islamica di Roma — Sito

Sito istituzionale del **CIR**, costruito con Next.js 16 (App Router, React Server Components), TypeScript strict, Tailwind CSS v4 e CMS git-based **Keystatic**. Multilingua (italiano/inglese/arabo/bengalese, `next-intl`) con fallback automatico all'italiano dove manca una traduzione.

## Requisiti

- Node.js 20.9+ (LTS)
- pnpm 9+

## Avvio in locale

```bash
pnpm install
cp .env.example .env.local   # poi compila i valori
pnpm dev                     # http://localhost:3100
```

> La porta è fissata a **3100** (la 3000 è occupata da un altro progetto locale).
> Admin CMS: **http://localhost:3100/keystatic**

## Comandi

| Comando       | Descrizione                     |
| ------------- | ------------------------------- |
| `pnpm dev`    | Server di sviluppo (Turbopack)  |
| `pnpm build`  | Build di produzione             |
| `pnpm start`  | Avvia la build di produzione    |
| `pnpm lint`   | ESLint                          |
| `pnpm format` | Formatta il codice con Prettier |

## Struttura

```
app/
  [locale]/    Root locale-aware (it/en/ar/bn) — genera <html lang dir>, font per script
    (site)/    Sito pubblico (home, eventi, news, chi-siamo, contatti, legali) + layout con header/footer
    keystatic/ Admin CMS (isolato, senza header/footer del sito, NON localizzato)
  api/         Route handler Keystatic
  sitemap.ts, robots.ts, not-found.tsx
components/    Componenti UI riusabili (layout, ui, home, eventi, news, seo, contatti, legal)
content/       Contenuti gestiti da Keystatic (JSON eventi/categorie/site, MDX articoli) — l'italiano
               resta nei campi principali, le altre lingue in `traduzioni.<locale>` per ogni entry
i18n/          Config next-intl: routing.ts (locales, default, prefissi), navigation.ts, request.ts
messages/      Cataloghi stringhe UI: it.json (sorgente), en/ar/bn.json (traduzioni o placeholder)
lib/
  content/     Layer dati tipizzato, locale-aware (getEventi(locale), getArticoli({locale})…)
  seo/         Helper JSON-LD, template Open Graph, alternates/hreflang
  utils/       Date it-IT, ICS, reading time, cn
  data/        Copy istituzionale (valori, storia, media) — resta in italiano su ogni lingua
public/        Asset statici (logo.svg, immagini, pattern)
scripts/       seed.mjs (contenuti di seed), gen-placeholder-messages.mjs (placeholder EN/AR/BN)
```

---

## 📝 Guida per i redattori (pubblicare senza toccare codice)

L'area di amministrazione è su **`/keystatic`** (in locale: <http://localhost:3100/keystatic>).

### Pubblicare un evento

1. Vai su `/keystatic` → **Eventi** → **＋** (nuovo).
2. Compila **Titolo** (lo slug/URL si genera da solo), **Data/ora inizio e fine**, **Luogo**, **Estratto**.
3. Carica una **Copertina** (opzionale: se manca, viene mostrato un motivo geometrico on-brand).
4. Spunta **In evidenza** se vuoi mostrarlo in home.
5. **Save**. L'evento appare nella timeline `/eventi`; data, badge "In programma/Concluso", file `.ics` e link "Aggiungi a Google Calendar" sono automatici.

### Pubblicare un articolo o comunicato

1. `/keystatic` → **Articoli e comunicati** → **＋**.
2. Compila **Titolo**, **Estratto**, scegli **Tipo** (Articolo o Comunicato) e **Categoria**.
3. Scrivi il **Corpo** nell'editor (grassetto, liste, citazioni, immagini…).
4. **Autore** e **Tempo di lettura** hanno valori sensati di default (il tempo si calcola dal testo).
5. Spunta **In evidenza** per mostrarlo in home. **Save**.

### Modificare categorie e configurazione

- **Categorie**: `/keystatic` → Categorie (nome, descrizione, colore teal/arancione).
- **Configurazione sito**: `/keystatic` → Configurazione sito — qui inserirai **email, telefono e indirizzo** quando disponibili (vedi `DA-FORNIRE.md`), oltre a social, link donazioni ed etichetta della sezione News.

> In locale le modifiche salvano direttamente i file in `content/`. In produzione i redattori editano online (GitHub mode) — vedi sotto.

### 🔐 Editing online dei redattori (Keystatic GitHub mode)

In produzione su Vercel il filesystem è di sola lettura, quindi la "local mode" non permette di salvare. Per far editare i redattori online si usa la **GitHub mode**: ogni salvataggio diventa un commit sul repo, che fa ri-deployare il sito.

Lo storage si sceglie in automatico in base ai segreti: **senza `KEYSTATIC_GITHUB_CLIENT_ID` → local mode** (sviluppo); **con i segreti impostati → github mode** (produzione). Il codice non va toccato — solo le env var.

**Setup una tantum (prima del deploy):**

1. Avvia il progetto puntando a github mode e apri **`/keystatic`** (in locale con i segreti, o sul deploy): parte il wizard **`/keystatic/setup`** che crea la **GitHub App** per te (pre-compila il form su GitHub, tu clicchi "Create app"). L'app va **installata sul repo** `Nure-Qucina/CIR`.
2. Il wizard restituisce i valori da mettere nelle env di Vercel:
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`
   - `KEYSTATIC_SECRET` — genera una stringa casuale, es. `openssl rand -hex 32`
3. Aggiungi **ogni redattore come collaboratore** del repo con permesso di scrittura (in github mode ogni redattore accede con il **proprio account GitHub**).
4. Imposta le 4 env su Vercel (Production) e fai il deploy. ⚠️ In github mode il build **fallisce** se mancano `CLIENT_ID`/`CLIENT_SECRET`/`KEYSTATIC_SECRET`: vanno impostate **prima** del primo build.

> Se il repo si sposta (es. nell'organizzazione del CIR), aggiornare `KEYSTATIC_REPO` in `keystatic.config.ts` e reinstallare la GitHub App sul nuovo repo.
>
> **Alternativa senza GitHub per i redattori:** se i redattori non hanno (o non vogliono) un account GitHub, si può usare **Keystatic Cloud** (`storage: { kind: "cloud" }` + progetto su keystatic.cloud): invito via email, nessun account GitHub per-persona. Richiede un progetto Keystatic Cloud.

### 🌍 Pubblicare in più lingue (IT / EN / AR / BN)

Il sito è disponibile in italiano (default, senza prefisso: `/eventi`), inglese (`/en/eventi`), arabo (`/ar/eventi`, layout specchiato da destra a sinistra) e bengalese (`/bn/eventi`).

**L'italiano è sempre obbligatorio** e vive nei campi principali della scheda (Titolo, Estratto, Descrizione, SEO…) — sono gli stessi campi di sempre, non cambia nulla nel flusso che già conosci.

**Le altre lingue sono opzionali** e si compilano nel gruppo **"Traduzioni"** in fondo alla scheda di ogni evento/articolo/categoria, con una sotto-sezione per English / العربية / বাংলা:

- Se compili la traduzione di una lingua, quella versione dell'evento/articolo apparirà tradotta su quel locale.
- Se **lasci vuota** una lingua (anche solo il Titolo), i visitatori di quella lingua vedranno automaticamente **la versione italiana**, con un piccolo badge "Disponibile in italiano" (tradotto anche lui) accanto al titolo — non c'è mai una pagina vuota o rotta.
- Non serve tradurre tutto in un colpo solo: puoi pubblicare solo in italiano oggi e aggiungere l'inglese la settimana prossima, semplicemente riaprendo la scheda e compilando "Traduzioni → English".
- Per gli **articoli**, il corpo del testo ha un editor MDX separato per ogni lingua (Corpo articolo IT nel campo principale, Corpo articolo EN/AR/BN dentro "Traduzioni").
- Lo **slug/URL** (`/eventi/nome-evento`) è sempre lo stesso in tutte le lingue — solo il prefisso cambia (`/en/eventi/nome-evento`, `/ar/eventi/nome-evento`…): non serve (e non si può) creare schede separate per lingua.

**Le stringhe dell'interfaccia** (bottoni, menu, etichette come "Dettagli" o "Torna a") NON si modificano da Keystatic: vivono nei file `messages/it.json` (sorgente) ed `en.json`/`ar.json`/`bn.json`. Le traduzioni EN/AR/BN attuali sono **placeholder generati automaticamente** (prefisso `[EN]`/`[AR]`/`[BN]`) finché non arrivano traduzioni professionali — per aggiornarle basta modificare direttamente il file JSON della lingua interessata (chiave per chiave, stessa struttura di `it.json`). Se aggiungi una nuova chiave in `it.json`, rigenera i placeholder mancanti nelle altre lingue con:

```bash
node scripts/gen-placeholder-messages.mjs
```

> ⚠️ **Non tradurre automaticamente** i contenuti istituzionali (mission, storia, valori, testi legali, temi religiosi/politici sensibili): vanno sempre revisionati da una persona prima di pubblicarli in altre lingue.

---

## Design system

Token colore brand (crema `#F8EFE3`, arancione `#EC8B36`, teal `#5F746E`, ink `#2A1F0E`)
definiti in `app/globals.css` e mappati nel theme Tailwind. Pagina styleguide (non indicizzata) su `/styleguide`.

Regole di contrasto (WCAG AA): CTA arancione = testo **ink**; badge/CTA teal = testo **bianco**; corpo = ink su crema.

## SEO & performance

- Metadata + `generateMetadata` su tutte le pagine, canonical, Open Graph + Twitter, OG image dinamiche (`next/og`, con font arabo/bengalese per le pagine in quelle lingue).
- **hreflang multilingua**: ogni pagina dichiara `alternates.languages` solo per le lingue in cui esiste davvero (per eventi/articoli/categorie, solo quelle tradotte — mai la sola versione fallback IT), più `x-default` → italiano. Header `Link` automatico di next-intl disattivato (`alternateLinks: false` in `i18n/routing.ts`) per evitare doppioni/contraddizioni.
- `openGraph.locale` + `alternateLocale` per pagina (`lib/seo/metadata.ts`).
- JSON-LD: Organization, WebSite+SearchAction, Event, Article/NewsArticle, BreadcrumbList — con `inLanguage` e URL sempre coerenti con la lingua realmente mostrata (fallback IT incluso).
- `sitemap.xml` e `robots.txt` generati dai contenuti, con una riga per lingua disponibile e `alternates.languages`.
- SSG/ISR (`revalidate: 3600`) su tutte le lingue, `next/font` self-hosted (preload solo del font della lingua corrente), `next/image`, JS client minimo.

### Verifica Lighthouse (target ≥ 95)

```bash
pnpm build && pnpm start
# in un altro terminale, su Chrome: DevTools → Lighthouse → Mobile
# oppure: npx lighthouse http://localhost:3100 --view
```

Verifica **ogni lingua**, non solo l'italiano — in particolare almeno una pagina in arabo (RTL, font diverso):

```bash
npx lighthouse http://localhost:3100/en --view
npx lighthouse http://localhost:3100/ar --view
npx lighthouse http://localhost:3100/bn --view
```

## Dati ancora da fornire

Vedi **`DA-FORNIRE.md`**: contatti reali, logo ufficiale, foto, date/autori reali degli articoli.
Finché non arrivano, il sito mostra placeholder evidenti (mai dati finti).

## Deploy

Si lavora **in locale**. Il deploy su Vercel va lanciato esplicitamente:

1. Importa il repo su Vercel (framework rilevato: Next.js).
2. Imposta le env (`NEXT_PUBLIC_SITE_URL`, e — se usati — `RESEND_API_KEY`, `CONTACT_FORM_TO`, le chiavi Keystatic GitHub).
3. Deploy. ISR e OG dinamiche funzionano nativamente.
