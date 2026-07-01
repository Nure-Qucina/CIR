# ⚠️ Dati e asset da fornire (CIR)

Questi elementi non erano disponibili durante lo sviluppo. Il sito funziona già
con **placeholder evidenti e on-brand** (mai dati inventati): appena fornisci i
dati reali, vanno inseriti dove indicato.

## 1. Contatti (priorità alta)

Sul sito attuale erano placeholder finti ("London, NewYork", numero falso): **non inseriti**.

- **Email** ufficiale del CIR
- **Telefono**
- **Indirizzo della sede**

➡️ Inserimento: `/keystatic` → **Configurazione sito** → sezione **Contatti**.
Finché vuoti, la pagina `/contatti` mostra un avviso e invita a usare il modulo/social.

## 2. Form contatti — provider email

Il modulo `/contatti` è completo (validazione, anti-spam, stati). Per l'invio reale serve **Resend**:

- Crea un account Resend, verifica un dominio mittente.
- In `.env.local` (e su Vercel) imposta `RESEND_API_KEY` e `CONTACT_FORM_TO`.
- Aggiorna il mittente in `app/(site)/contatti/actions.ts` (`from:`) con un indirizzo del dominio verificato.

## 3. Asset grafici

- ✅ **Logo ufficiale** — ricevuto in 3 varianti (colore, nero, bianco). In uso: **Header** = icona "CIR" ritagliata dalla versione nera (`public/LogoCirNeroIcon.png`, senza wordmark); **Footer** = icona ritagliata dalla versione bianca (`public/LogoCirBiancoIcon.png`, senza wordmark) ricolorata via CSS mask nello stesso crema del testo; **JSON-LD** (Organization/Article) = versione a colori completa con wordmark (`public/LogoCir.png`).
- **Favicon** — ancora l'icona geometrica provvisoria (`app/icon.svg`): il file fornito è un lockup orizzontale (icona + wordmark) non adatto a un'icona quadrata piccola. Se disponibile, fornisci anche un mark quadrato isolato (solo "CIR", senza testo) per sostituire la favicon.
- **Foto reali** ad alta risoluzione per eventi e articoli. Senza foto si mostra un motivo geometrico on-brand.

➡️ Le immagini si caricano direttamente da `/keystatic` (campo Copertina) o si mettono in `public/images/...`.

## 4. Contenuti articoli

- **Date di pubblicazione** e **autori reali** (sul sito attuale non sono esposti): ora sono **placeholder**.
- **Corpo integrale** degli articoli: ora c'è estratto + nota segnaposto. Il testo completo va migrato dal sito attuale (`comunitaislamicadiroma.it/{slug}`) nel campo **Corpo** di ciascun articolo.

## 5. Pagine legali

Privacy, Cookie e Termini contengono testo **provvisorio**. Vanno sostituiti con
le informative definitive (verificate da un consulente privacy/legale).

---

_Tutti i punti sopra sono già gestiti con fallback: il sito è pubblicabile e si
arricchisce man mano che i dati arrivano._
