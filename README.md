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

### Bozze — nascondere senza eliminare

Ogni **evento** e ogni **articolo** ha una casella **"Bozza (nascosto dal sito)"** in cima alla scheda:

- **Spuntata** → il contenuto è invisibile sul sito pubblico: non appare negli elenchi, non è raggiungibile via link diretto (la pagina risponde 404) e non è in sitemap. Resta però visibile e modificabile in Keystatic.
- **Deselezionata** (default) → il contenuto è pubblicato normalmente.

Usala per gli articoli **in attesa di approvazione**, per i lavori in corso, o per **ritirare temporaneamente** un contenuto senza perderlo. Per pubblicare basta togliere la spunta e salvare. La colonna "bozza" nell'elenco mostra a colpo d'occhio lo stato di ogni scheda.

**Più bozze in una volta:** su **`/admin/bozze`** trovi l'elenco completo di articoli ed eventi con una casella ciascuno — spunti/togli quello che vuoi e premi **Salva**: tutte le modifiche diventano **un solo commit → un solo deploy** (invece di entrare e salvare scheda per scheda). Serve lo stesso login GitHub di Keystatic: se la pagina te lo chiede, apri prima `/keystatic`, accedi, e torna su `/admin/bozze`.

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

## Donazioni (Stripe)

Flusso interno `/donazioni` con Checkout Sessions (`ui_mode: "elements"`). Due tipi:

- donazione singola (`frequency: "one_time"`, `mode: "payment"`)
- donazione mensile (`frequency: "monthly"`, `mode: "subscription"` con `price_data.recurring.interval: "month"`)

Prima della Checkout Session il modulo raccoglie nome, cognome, email e visibilità (`public` | `anonymous`). **Anonimo** significa solo che il nome non va mostrato pubblicamente: CIR e Stripe conservano i dati necessari a elaborare e gestire la donazione. L’email è usata solo per comunicazioni transazionali sulla donazione (nessun consenso newsletter in questo flusso).

La sessione è esplicita: `payment_method_types: ["card", "link", "paypal", "sepa_debit"]` sia per il pagamento unico sia per l’abbonamento mensile. La carta è il fallback universale. SEPA Direct Debit compare nel Payment Element (IBAN e mandato restano di Stripe; CIR non li memorizza). Apple Pay, Google Pay, PayPal e Link compaiono in Express Checkout solo se Stripe, il browser, l’account e il dominio li ammettono. Klarna, Amazon Pay, Bancontact, EPS, Satispay e altri metodi BNPL/ecommerce locali non fanno parte del flusso.

`POST /api/donazioni/checkout` accetta solo:

```json
{
  "amount": "25",
  "locale": "it",
  "frequency": "one_time",
  "firstName": "Sara",
  "lastName": "Rossi",
  "email": "sara@example.com",
  "visibility": "anonymous",
  "coverProcessingCosts": false,
  "turnstileToken": "…"
}
```

Campi mancanti, sconosciuti, email malformate, `frequency`/`visibility` non ammessi, `coverProcessingCosts` non booleano o lunghezze eccessive vengono rifiutati. Il server resta autoritativo: l’eventuale contributo ai costi è calcolato solo lato server (mai un importo commissione inviato dal client).

`GET /api/donazioni/status` restituisce `{ state, amount, donationAmount, contributionAmount, currency, frequency }`. Non espone nome, email, Customer/Subscription/Invoice ID, IBAN o mandato. L’esito in `/donazioni/esito` si verifica sempre da questa API, mai dall’URL.

Prima di creare la Checkout Session, `POST /api/donazioni/checkout` esegue: same-origin → sessione donazione/CSRF → rate limit Upstash → verifica Turnstile server-side → validazione payload → Stripe. Il webhook **non** è dietro questo rate limiter.

Variabili:

- `DONATIONS_ENABLED=true` per abilitare
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` per `POST /api/donazioni/webhook` (non hard-codare nel repo)
- `STRIPE_CUSTOMER_PORTAL_LOGIN_URL` (opzionale) URL hosted di login del Customer Portal Stripe, es. `https://billing.stripe.com/p/login/test_...`
- `NEXT_PUBLIC_SITE_URL` (origine autoritativa del sito, senza path). I deployment **Vercel Preview** devono impostare questa variabile sull’URL di _quel_ Preview, non sull’origine di produzione CIR. Il controllo same-origin non viene allentato per far funzionare i Preview.
- `DONATION_SESSION_SECRET` (≥ 32 caratteri) firma cookie sessione/CSRF
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` rate limit distribuito
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (in locale usa le [test key Cloudflare](https://developers.cloudflare.com/turnstile/troubleshooting/testing/)). In produzione le test key Cloudflare sono rifiutate: `donationSecurityReady` fallisce chiuso e Siteverify non ha eccezioni sul campo `action`.
- `TURNSTILE_ALLOWED_HOSTNAMES` (CSV, niente wildcard) in aggiunta all’hostname di `NEXT_PUBLIC_SITE_URL`. Locale/test-key: `localhost,127.0.0.1,example.com` (le dummy key Cloudflare possono riportare `example.com`). Preview: l’hostname del Preview. Produzione: l’hostname CIR. Siteverify richiede `success === true`, `action === donation_checkout` e hostname in questa allow-list. Solo in non-produzione, e solo con la dummy secret always-pass documentata, un `action` vuoto della risposta di test Cloudflare è accettato. Hostname/action dal body client sono ignorati.
- `DONATION_FEE_REFERENCE_BPS` e `DONATION_FEE_REFERENCE_FIXED_CENTS`: stima del contributo costi. I default `150` + `25` sono **riferimenti di sviluppo**, non la commissione Stripe reale del CIR. In produzione vanno impostati esplicitamente. Il calcolo non dipende dal metodo di pagamento scelto dal client.
- `RESEND_API_KEY` (opzionale) per l’email di ringraziamento transazionale
- `DONATION_EMAIL_FROM` (opzionale; default di sviluppo: `Sito CIR <onboarding@resend.dev>`)
- Override opzionali: `DONATION_RATE_LIMIT_SESSION_MAX` / `_WINDOW_SEC`, `DONATION_RATE_LIMIT_IP_MAX` / `_WINDOW_SEC`, `DONATION_RATE_LIMIT_EMAIL_MAX` / `_WINDOW_SEC`, `DONATION_RATE_LIMIT_MINT_MAX` / `_WINDOW_SEC`

Con `DONATIONS_ENABLED=true`, checkout e sessione donazione **falliscono chiusi** se manca la configurazione di sicurezza (niente bypass locale).

Rate limit di default (configurabili con `DONATION_RATE_LIMIT_*`): 5 creazioni Checkout / 10 minuti per sessione donazione, 10 / ora per IP (hash), 8 / ora per email normalizzata hashata, **20 mint sessione / ora / IP** (`DONATION_RATE_LIMIT_MINT_MAX` / `DONATION_RATE_LIMIT_MINT_WINDOW_SEC`) su `POST /api/donazioni/session` (niente Turnstile; un cookie valido già presente non conta come mint). Le risposte 429 sono generiche (`too_many_requests`) con `Retry-After`; non espongono i limiti.

### IP client (rate limit e Turnstile `remoteip`)

Su **Vercel** l’IP usato per l’hash (mai loggato in chiaro) è `x-vercel-forwarded-for`, header di piattaforma. Non si usa il primo valore di `X-Forwarded-For` (il client può iniettarlo). Se manca `x-vercel-forwarded-for` ma è presente `x-vercel-id`, si usa **solo l’ultimo** hop di `X-Forwarded-For` (Vercel aggiunge l’IP di connessione).

In **locale** `X-Forwarded-For` e `X-Real-IP` vengono ignorati: l’identità è `unknown` (un solo bucket di rate limit). IPv4-mapped IPv6 (`::ffff:a.b.c.d`) è normalizzato a IPv4; IPv6 è espanso in forma canonica prima dell’hash.

### Protezione card-testing e Radar

Stripe Payment Element / Checkout mantiene le protezioni native. In più CIR applica sessione firmata, CSRF, origin, Turnstile e Upstash Redis.

Radar **non** si configura da codice. In Dashboard Sandbox e Live:

1. **Radar → Risk controls** (o Payments → Radar): lascia attiva la protezione frodi.
2. Abilita i controlli risk-aware su CVC / CAP dove disponibili.
3. Non aggiungere blocchi paese ampi.
4. Regole di velocity custom possono richiedere **Radar for Fraud Teams**.

Carte Radar (Sandbox, non sono un cambio Dashboard applicato da CIR):

| PAN                   | Nota                     |
| --------------------- | ------------------------ |
| `4100 0000 0000 0019` | Sempre bloccata da Radar |
| `4000 0000 0000 4954` | Rischio massimo          |
| `4000 0000 0000 9235` | Rischio elevato          |

### Contributo facoltativo ai costi

Checkbox nello step 1, **spenta** di default. Formula server (**stima**, non commissione Stripe reale e non dipendente dal metodo di pagamento):

`total = ceil((donazione + fisso) / (1 - bps/10000))`, contributo = totale − donazione.

I default 150 bps + 25 cent sono riferimenti di sviluppo. Con quei default su 25,00 € il contributo stimato è 0,64 € (totale 25,64 €). In produzione impostare `DONATION_FEE_REFERENCE_BPS` e `DONATION_FEE_REFERENCE_FIXED_CENTS`. Per il mensile entrambi gli importi sono ricorrenti. Stripe riceve due line item distinti se il checkbox è attivo.

### Webhook (locale)

Endpoint: `POST /api/donazioni/webhook`. Verifica la firma Stripe sul body raw. Senza `STRIPE_WEBHOOK_SECRET` la route risponde 503.

Eventi:

- `checkout.session.completed` — email di ringraziamento iniziale solo se `payment_status=paid` (carta/immediato). SEPA in elaborazione **non** invia il thank-you.
- `checkout.session.async_payment_succeeded` — thank-you dopo addebito asincrono confermato. Idempotenza provider Resend = `cir-donation-{checkoutSessionId}` (niente duplicati con `completed`).
- `checkout.session.async_payment_failed` — log sicuro, nessun thank-you
- `invoice.paid` — nessun ringraziamento custom (evita duplicati; i rinnovi usano le ricevute Stripe)
- `invoice.payment_failed` — log sicuro (`event.id` + `type`), niente PII
- `customer.subscription.updated` — log sicuro, nessun email
- `customer.subscription.deleted` — log sicuro, nessuno side-effect persistente

In locale:

```bash
stripe listen --forward-to localhost:3100/api/donazioni/webhook
```

Copia il `whsec_...` stampato da Stripe CLI in `.env.local` come `STRIPE_WEBHOOK_SECRET`, poi riavvia `pnpm dev`. Non committare il secret. In Dashboard (Sandbox/live): Developers → Webhooks → Add endpoint, stessi eventi, secret in env.

**Idempotenza / persistenza:** l’email usa la chiave provider Resend `cir-donation-{checkoutSessionId}`. La stessa donazione logica riusa la stessa chiave su tutti i webhook idonei (`checkout.session.completed` con `payment_status=paid` e `checkout.session.async_payment_succeeded`), così Resend evita i duplicati comuni a livello provider. Non è exactly-once applicativo durevole: non c’è un ledger DB/KV dei side-effect. Non usare un Set in memoria. Se in futuro servono altri side-effect exactly-once (contabilità, CRM, retry custom), occorre uno store persistente.

### Customer Portal (donazioni mensili)

Approccio no-code hosted di Stripe, senza autenticazione custom CIR e senza Customer/Subscription ID nelle URL.

In Stripe Dashboard → **Settings → Billing → Customer portal**:

1. Attiva il Customer Portal.
2. Abilita aggiornamento metodo di pagamento.
3. Abilita cronologia fatture (invoice history).
4. Abilita cancellazione abbonamento.
5. Attiva la **hosted login page** (“Activate link”) e copia l’URL `https://billing.stripe.com/p/login/...`.

Imposta `STRIPE_CUSTOMER_PORTAL_LOGIN_URL` con quell’URL. L’email mensile include allora il testo «Gestisci la tua donazione mensile» con quel link. Se la variabile manca o non è un URL Stripe `/p/login/`, l’email parte comunque senza link. Il donatore accede con la propria email; Stripe invia il magic link.

### Email transazionale

Solo dopo verifica Stripe lato webhook. Non parte dalla pagina esito. Nessun contenuto marketing/newsletter.

- Una tantum: nome, importo, ringraziamento, indica che è una donazione unica.
- Mensile: nome, importo al mese, conferma che la donazione ricorrente è attiva, link al portale se configurato.
- Nessuna email custom su ogni `invoice.paid` di rinnovo.

CIR **non** invia una seconda ricevuta di pagamento. Abilita in Stripe Dashboard → **Settings → Customer emails** (o Billing email settings) le ricevute automatiche / invoice emails: è il canale di ricevuta fiscale/contabile. L’email Resend CIR resta il ringraziamento di marca e, per il mensile, il link di gestione.

### Carte di test (Sandbox)

Validazione numero/scadenza/CVC/3DS e i rifiuti dell’emittente restano di Stripe Elements. Non inserire dati carta in log CIR.

| Caso                 | PAN                   | Note                                            |
| -------------------- | --------------------- | ----------------------------------------------- |
| Successo             | `4242 4242 4242 4242` | Una tantum e mensile                            |
| Fondi insufficienti  | `4000 0000 0000 9995` | Rifiuto, form resta usabile                     |
| Declino generico     | `4000 0000 0000 0002` | Rifiuto                                         |
| Carta scaduta        | `4000 0000 0000 0069` | Rifiuto                                         |
| CVC errato           | `4000 0000 0000 0127` | Rifiuto                                         |
| Numero non valido    | `4242 4242 4242 4241` | Bloccato da Elements (Luhn) prima del confirm   |
| 3DS                  | `4000 0000 0000 3220` | Autenticazione SCA                              |
| Rinnovo che fallisce | `4000 0000 0000 0341` | Si attacca; il **successivo** addebito fallisce |

Qualsiasi errore di `checkout.confirm()` resta sulla pagina di pagamento: messaggio donatore (testo Stripe se sicuro, altrimenti errore generico CIR), pulsante Dona riabilitato, nessun passaggio all’esito di successo.

### SEPA Direct Debit (Sandbox)

IBAN di test Stripe (Payment Element, non input CIR):

| Caso                 | IBAN                   |
| -------------------- | ---------------------- |
| Successo             | `AT611904300234573201` |
| Successo ritardato   | `AT321904300235473204` |
| Fallimento           | `AT861904300235473202` |
| Fallimento ritardato | `AT051904300235473205` |
| Fondi insufficienti  | `AT981904300002222227` |

Una tantum: `completed` + pagamento in corso → stato `pending` (niente email di successo). `async_payment_succeeded` → `paid` + thank-you. `async_payment_failed` → `unpaid`. Mensile: addebito/invoice ancora `open` o in elaborazione → `pending` **anche se** Checkout è `complete` e la subscription è già `active`. `paid` solo con subscription `active` **e** invoice rilevante `paid`. Un rinnovo in elaborazione può restare `pending`; invoice/payment falliti o subscription `canceled` → `unpaid`. CIR non crea trial: `trialing` non è un successo.

In Dashboard: Payments → Payment methods → attiva **SEPA Direct Debit** (Sandbox e Live).

### Test clock / rinnovo mensile (Sandbox)

Procedura Dashboard, non dal form pubblico:

1. Stripe Dashboard (Sandbox) → **Billing → Test clocks** → crea un test clock.
2. Crea un Customer sul clock e una subscription mensile CIR (stesso importo/prezzo della donazione), **oppure** completa una donazione mensile di test e, se il Dashboard lo consente, associa il customer al clock.
3. Per il fallimento di rinnovo usa la carta `4000 0000 0000 0341` come metodo del customer.
4. **Advance** il clock di un mese.
5. Verifica che Stripe crei una nuova invoice.
6. Percorso ok: `invoice.paid` sul webhook; CIR **non** invia un secondo thank-you; la subscription resta `active`.
7. Percorso ko: `invoice.payment_failed`; la subscription passa tipicamente a `past_due` / `unpaid`. `GET /api/donazioni/status` **non** restituisce `paid` se lo stato corrente non è `active`, anche se il Checkout Session iniziale era pagato. CIR non crea trial: `trialing` non è un successo.

### Piano di verifica manuale (Sandbox)

Da eseguire a mano con Dashboard, `stripe listen`, carta di test Stripe (`4242…`) e Resend configurato. Non considerare verificato finché non è stato fatto in ambiente reale.

- A. Donazione unica con carta, 25 € → esito verificato
- B. Donazione mensile con carta, 25 € → abbonamento attivo, esito verificato
- C. Donazione mensile custom 12,50 € → sessione e primo pagamento
- D. Refresh della pagina `/donazioni/esito` → stesso esito, senza inferirlo dall’URL
- E. Login al Customer Portal (hosted login page) con l’email del donatore
- F. Cancellazione della donazione mensile dal Customer Portal
- G. Ricezione webhook `customer.subscription.deleted` su `stripe listen` / endpoint
- H. Una email transazionale Resend (ringraziamento iniziale, non un rinnovo)

**Test carta:** `localhost` (es. `http://localhost:3100`) va bene per donazioni con carta.

**Test Apple Pay / Google Pay:** non usare `always` in sviluppo. I wallet compaiono solo con `auto` su browser/dispositivo compatibili e su un dominio HTTPS registrato. In Stripe Dashboard → **Settings → Payment methods → Payment method domains**: registra il dominio di test (es. Vercel Preview) nel **Sandbox** e il dominio di produzione CIR in **live**. `localhost` non è adatto a un test wallet completo.

**Test Link:** dipende da eleggibilità Stripe (browser, account). L’email del donatore è raccolta nello step 1 e associata alla sessione con `customer_email`; il `ContactDetailsElement` resta per Link.

**Test PayPal:** richiede PayPal attivo sull’account Stripe (Dashboard → **Settings → Payment methods → PayPal → Turn on**). Per le donazioni mensili serve anche **PayPal recurring payments / Billing Agreements** sullo stesso account. In questo Sandbox la creazione di Checkout Session `mode: subscription` con `paypal` è riuscita (insieme a card e Link). Le credenziali PayPal non vanno in env né nel repo. Dopo l’autorizzazione PayPal, il donatore torna su `/donazioni/esito`; l’esito è verificato server-side sulla Checkout Session, non inferito dall’URL.

Il supporto wallet/Link/PayPal non si considera verificato finché non è stato provato su un dispositivo/browser/dominio eleggibile.

### Ambiente locale (Sandbox)

Checklist operativa, da confermare a mano:

- `stripe listen --forward-to localhost:3100/api/donazioni/webhook` sullo **stesso** account Sandbox di `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` = signing secret stampato dal listen (solo `.env.local`)
- Turnstile: test/dummy keys Cloudflare in locale; non usarle in Production
- Upstash Redis di sviluppo per i rate limit
- Resend opzionale (`RESEND_API_KEY`, `DONATION_EMAIL_FROM` su dominio verificato)
- Customer Portal: URL hosted `/p/login/` Sandbox in `STRIPE_CUSTOMER_PORTAL_LOGIN_URL` se si testa l’email mensile
- SEPA: addebito asincrono → CIR `pending` finché l’invoice/PI non è pagato

### Preview (Vercel)

Ogni Preview è un’origine distinta. Impostare **su quel Preview**:

- `NEXT_PUBLIC_SITE_URL` = URL HTTPS di _quel_ deployment (niente path)
- chiavi Stripe **test/Sandbox** (non live)
- `TURNSTILE_ALLOWED_HOSTNAMES` con l’hostname del Preview
- webhook Sandbox (endpoint Preview o `stripe listen` solo in locale)
- portal Sandbox
- Payment Method Domain Sandbox per Apple Pay / Google Pay (non `localhost`)

Non riusare le env di produzione CIR su un Preview.

### Produzione (live)

Da configurare in Dashboard / Vercel; **non** è completato da questo codice:

- chiavi Stripe live, webhook live, Customer Portal live
- Payment Method Domains sul dominio CIR
- Radar (Dashboard)
- business profile, statement descriptor, conto payout
- PayPal e SEPA live se accettati
- Turnstile di produzione (le dummy key Cloudflare sono rifiutate)
- mittente Resend verificato
- Upstash di produzione
- `NEXT_PUBLIC_SITE_URL` = origine pubblica CIR

## Deploy

Si lavora **in locale**. Il deploy su Vercel va lanciato esplicitamente:

1. Importa il repo su Vercel (framework rilevato: Next.js).
2. Imposta le env (`NEXT_PUBLIC_SITE_URL`, e — se usati — `RESEND_API_KEY`, `CONTACT_FORM_TO`, le chiavi Keystatic GitHub).
3. Deploy. ISR e OG dinamiche funzionano nativamente.
