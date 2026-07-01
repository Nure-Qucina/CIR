# Comunità Islamica di Roma — Sito

Sito istituzionale del **CIR**, costruito con Next.js 16 (App Router, React Server Components), TypeScript strict, Tailwind CSS v4 e CMS git-based **Keystatic**.

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
  (site)/      Sito pubblico (home, eventi, news, chi-siamo, contatti, legali) + layout con header/footer
  keystatic/   Admin CMS (isolato, senza header/footer del sito)
  api/         Route handler Keystatic
  sitemap.ts, robots.ts, opengraph-image.tsx, icon.svg
components/    Componenti UI riusabili (layout, ui, home, eventi, news, seo, contatti, legal)
content/       Contenuti gestiti da Keystatic (JSON eventi/categorie/site, MDX articoli)
lib/
  content/     Layer dati tipizzato (getEventi, getArticoli, getCategorie, getSiteConfig…)
  seo/         Helper JSON-LD e template Open Graph
  utils/       Date it-IT, ICS, reading time, cn
  data/        Copy istituzionale (valori, storia, media)
public/        Asset statici (logo.svg, immagini, pattern)
scripts/seed.mjs  Generatore dei contenuti di seed
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

> In locale le modifiche salvano direttamente i file in `content/`. Per dare accesso ai redattori senza farli lavorare in locale si configura Keystatic in **GitHub mode** (vedi `.env.example`).

---

## Design system

Token colore brand (crema `#F8EFE3`, arancione `#EC8B36`, teal `#5F746E`, ink `#2A1F0E`)
definiti in `app/globals.css` e mappati nel theme Tailwind. Pagina styleguide (non indicizzata) su `/styleguide`.

Regole di contrasto (WCAG AA): CTA arancione = testo **ink**; badge/CTA teal = testo **bianco**; corpo = ink su crema.

## SEO & performance

- Metadata + `generateMetadata` su tutte le pagine, canonical, Open Graph + Twitter, OG image dinamiche (`next/og`).
- JSON-LD: Organization, WebSite+SearchAction, Event, Article/NewsArticle, BreadcrumbList.
- `sitemap.xml` e `robots.txt` generati dai contenuti.
- SSG/ISR (`revalidate: 3600`), `next/font` self-hosted, `next/image`, JS client minimo.

### Verifica Lighthouse (target ≥ 95)

```bash
pnpm build && pnpm start
# in un altro terminale, su Chrome: DevTools → Lighthouse → Mobile
# oppure: npx lighthouse http://localhost:3000 --view
```

## Dati ancora da fornire

Vedi **`DA-FORNIRE.md`**: contatti reali, logo ufficiale, foto, date/autori reali degli articoli.
Finché non arrivano, il sito mostra placeholder evidenti (mai dati finti).

## Deploy

Si lavora **in locale**. Il deploy su Vercel va lanciato esplicitamente:

1. Importa il repo su Vercel (framework rilevato: Next.js).
2. Imposta le env (`NEXT_PUBLIC_SITE_URL`, e — se usati — `RESEND_API_KEY`, `CONTACT_FORM_TO`, le chiavi Keystatic GitHub).
3. Deploy. ISR e OG dinamiche funzionano nativamente.
