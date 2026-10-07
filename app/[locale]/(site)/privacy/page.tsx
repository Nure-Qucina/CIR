import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Info } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";
import { CookieSettingsButton } from "@/components/legal/CookieSettingsButton";
import { ElencoCookie } from "@/components/legal/ElencoCookie";
import { getSiteConfig } from "@/lib/content/site";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";

/** Da aggiornare a ogni modifica sostanziale del testo. */
const ULTIMO_AGGIORNAMENTO = "7 ottobre 2026";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "legal",
  });
  return {
    title: t("privacyCookie"),
    description:
      "Informativa privacy e cookie della Comunità Islamica di Roma (CIR): quali dati tratta il sito, perché, per quanto tempo e quali sono i tuoi diritti (GDPR).",
    robots: { index: true, follow: true },
    alternates: buildAlternates("/privacy", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
  };
}

/** Titolo di sezione con ancora (l'header è sticky: scroll-margin). */
function Titolo({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-28">
      {children}
    </h2>
  );
}

/**
 * Scheda di un trattamento: le stesse cinque voci per ogni attività, così
 * dati, finalità, base giuridica e conservazione si confrontano a colpo
 * d'occhio (art. 13 GDPR).
 */
function Scheda({
  dati,
  perche,
  base,
  durata,
  obbligo,
}: {
  dati: ReactNode;
  perche: ReactNode;
  base: ReactNode;
  durata: ReactNode;
  obbligo: ReactNode;
}) {
  const righe = [
    ["Quali dati", dati],
    ["Perché", perche],
    ["Base giuridica", base],
    ["Per quanto tempo", durata],
    ["È obbligatorio?", obbligo],
  ] as const;
  return (
    <dl className="foglio my-6 grid gap-x-6 gap-y-3 p-5 font-sans text-base sm:grid-cols-[10rem_1fr]">
      {righe.map(([voce, valore]) => (
        <div key={voce} className="contents">
          <dt className="text-ink font-semibold">{voce}</dt>
          <dd className="text-ink-soft">{valore}</dd>
        </div>
      ))}
    </dl>
  );
}

const INDICE = [
  ["titolare", "Chi è il titolare del trattamento"],
  ["dati", "Quali dati trattiamo e perché"],
  ["dati-religiosi", "Dati che possono rivelare convinzioni religiose"],
  ["destinatari", "A chi comunichiamo i dati"],
  ["trasferimenti", "Trasferimenti fuori dall’Unione europea"],
  ["sicurezza", "Come proteggiamo i dati"],
  ["cookie", "Cookie e strumenti simili"],
  ["diritti", "I tuoi diritti"],
  ["decisioni-automatizzate", "Decisioni automatizzate"],
  ["minori", "Minori"],
  ["modifiche", "Modifiche a questa informativa"],
] as const;

/**
 * Informativa Privacy e Cookie (pagina legale unica): artt. 13-14 GDPR,
 * art. 122 Codice privacy, linee guida cookie del Garante (10/6/2021).
 *
 * Il testo è in italiano in tutte le lingue (contenuto legale: non si
 * auto-traduce, vedi brief i18n); sulle pagine en/ar/bn una nota nella lingua
 * dell'utente lo spiega, e il blocco ha lang="it" dir="ltr". I dati del
 * titolare (nome, CF, sede, email) arrivano dalla config del sito (Keystatic).
 *
 * Il testo descrive il comportamento reale del codice: se cambiano fornitori,
 * cookie, script o moduli, va aggiornato qui (e ElencoCookie, e la data).
 */
export default async function PrivacyCookiePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, tc, site] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "legal" }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getSiteConfig(),
  ]);

  const { nome, sigla, codiceFiscale, contatti } = site;
  const { email, indirizzo } = contatti;

  const scrivici = email ? (
    <a href={`mailto:${email}`}>{email}</a>
  ) : (
    <Link href="/contatti">i recapiti della pagina Contatti</Link>
  );

  return (
    <main id="contenuto">
      <PageHeader
        titolo={t("privacyCookie")}
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: t("privacyCookie") },
        ]}
        illustrazione="documento"
      />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          {locale !== "it" && (
            <div className="mb-10 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm">
              <Info
                size={18}
                className="text-teal mt-0.5 shrink-0"
                aria-hidden
              />
              <p className="text-ink">
                {t("soloItaliano")}
                {email && <> {t("domandeDati", { email })}</>}
              </p>
            </div>
          )}

          <div lang="it" dir="ltr">
            <p className="text-ink-soft mb-8 text-sm">
              Ultimo aggiornamento: {ULTIMO_AGGIORNAMENTO}
            </p>

            <Prose>
              <p>
                In questa pagina ti spieghiamo quali dati personali tratta
                questo sito, per quali scopi, per quanto tempo e quali diritti
                hai. È l’informativa prevista dagli articoli 13 e 14 del
                Regolamento (UE) 2016/679 («GDPR») e dal Codice in materia di
                protezione dei dati personali (d.lgs. 196/2003), e comprende la
                cookie policy.
              </p>
            </Prose>

            <div className="foglio mt-8 p-6">
              <h2 className="text-ink text-lg font-bold">In breve</h2>
              <ul className="text-ink-soft mt-3 list-disc space-y-2 ps-5 [&_a]:font-medium [&_a]:text-teal-700 [&_a]:underline [&_a]:underline-offset-4">
                <li>
                  Raccogliamo solo i dati che ci dai tu (modulo contatti,
                  newsletter, donazioni) e i dati tecnici indispensabili al
                  funzionamento del sito.
                </li>
                <li>
                  Non vendiamo i tuoi dati e non li usiamo per pubblicità o
                  profilazione.
                </li>
                <li>
                  Il sito usa solo cookie tecnici. Le statistiche di visita,
                  senza cookie, partono solo se le accetti.
                </li>
                <li>
                  I pagamenti passano da Stripe: il CIR non vede e non conserva
                  i dati completi della carta o l’IBAN.
                </li>
                <li>
                  Puoi chiederci in ogni momento di vedere, correggere o
                  cancellare i tuoi dati scrivendo a {scrivici}.
                </li>
              </ul>
            </div>

            <nav aria-label="Indice dell’informativa" className="mt-8">
              <p className="text-ink text-sm font-semibold">Indice</p>
              <ol className="text-ink-soft mt-2 list-decimal space-y-1 ps-6 text-sm">
                {INDICE.map(([id, voce]) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="hover:text-teal underline-offset-4 hover:underline"
                    >
                      {voce}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <Prose className="mt-6">
              <Titolo id="titolare">
                1. Chi è il titolare del trattamento
              </Titolo>
              <p>
                Il titolare del trattamento è {nome} ({sigla})
                {codiceFiscale ? `, codice fiscale ${codiceFiscale}` : ""}
                {indirizzo ? `, con sede in ${indirizzo}` : ""}. Per qualsiasi
                domanda sui tuoi dati o per esercitare i tuoi diritti puoi
                scrivere a {scrivici}.
              </p>

              <Titolo id="dati">2. Quali dati trattiamo e perché</Titolo>
              <p>
                Ecco, attività per attività, quali dati usiamo, perché, su quale
                base giuridica e per quanto tempo li conserviamo.
              </p>

              <h3>2.1 Navigazione sul sito</h3>
              <p>
                Quando visiti il sito, il tuo browser invia automaticamente
                alcuni dati tecnici al server che lo ospita, come accade con
                qualsiasi sito web.
              </p>
              <Scheda
                dati="Indirizzo IP, data e ora della visita, pagina richiesta, sito di provenienza, tipo di browser e sistema operativo, eventuali errori."
                perche="Far funzionare il sito, proteggerlo da attacchi e abusi, risolvere i malfunzionamenti."
                base="Legittimo interesse del CIR alla sicurezza e al buon funzionamento del sito (art. 6, par. 1, lett. f GDPR)."
                durata="Per il tempo strettamente necessario alla sicurezza del sito, di norma pochi giorni, salvo che servano ad accertare reati o abusi."
                obbligo="Sì: senza questi dati il sito non può esserti mostrato."
              />

              <h3>2.2 Modulo contatti</h3>
              <p>
                Se ci scrivi dalla pagina Contatti, il messaggio ci arriva per
                email tramite il servizio Resend. Ti chiediamo di non inserire
                dati delicati (ad esempio sulla salute) se non sono davvero
                necessari.
              </p>
              <Scheda
                dati="Nome e cognome, indirizzo email, testo del messaggio e ogni altra informazione che decidi di scriverci."
                perche="Rispondere alla tua richiesta e gestire lo scambio che ne segue."
                base="La tua richiesta (art. 6, par. 1, lett. b GDPR) e il nostro legittimo interesse a rispondere a chi ci scrive (lett. f)."
                durata="Il tempo necessario a risponderti e poi non oltre 24 mesi dall’ultimo scambio, salvo che servano per un rapporto ancora in corso o per tutelare i diritti del CIR."
                obbligo="I campi del modulo servono per risponderti: senza, non possiamo farlo."
              />

              <h3>2.3 Newsletter</h3>
              <p>
                Puoi iscriverti alla newsletter dalla home page oppure, con una
                casella facoltativa e non preselezionata, dal modulo di
                donazione. L’iscrizione diventa attiva solo dopo che l’hai
                confermata cliccando il link nell’email che ti inviamo (doppia
                conferma). Ogni newsletter contiene un link per cancellarti;
                puoi anche scriverci.
              </p>
              <p>
                La newsletter è gestita con Brevo. Le email possono contenere
                strumenti che ci dicono, in forma aggregata, se sono state
                aperte e quali link sono stati cliccati: li usiamo solo per
                migliorare le nostre comunicazioni. Puoi evitarli disattivando
                il caricamento automatico delle immagini nel tuo programma di
                posta.
              </p>
              <Scheda
                dati="Indirizzo email, data e ora dell’iscrizione e della conferma. Se ti iscrivi dal modulo di donazione, registriamo con la donazione anche la prova della tua scelta (sì o no, data, lingua del sito)."
                perche="Inviarti aggiornamenti su attività, eventi, comunicati e iniziative del CIR."
                base="Il tuo consenso (art. 6, par. 1, lett. a GDPR), che puoi revocare in qualsiasi momento senza alcuna conseguenza."
                durata="Finché resti iscritto. Dopo la cancellazione conserviamo solo l’indirizzo nell’elenco di chi non vuole più ricevere la newsletter, per rispettare la tua scelta, e la prova del consenso per il tempo in cui può servire a dimostrarlo."
                obbligo="No, è facoltativo. Per iscriverti devi avere almeno 14 anni."
              />

              <h3>2.4 Donazioni online</h3>
              <p>
                Se fai una donazione dal sito, raccogliamo i dati del modulo e
                il pagamento viene gestito da Stripe. I dati della carta o del
                conto (IBAN) li inserisci direttamente nei campi di Stripe: il
                CIR non li vede e non li conserva, e riceve solo informazioni
                limitate (ad esempio il tipo di carta, le ultime cifre e il
                Paese) utili a gestire la donazione.
              </p>
              <p>
                Stripe Payments Europe, Limited tratta i dati di pagamento per
                nostro conto e, per alcune finalità proprie come la prevenzione
                delle frodi e gli obblighi di legge sui pagamenti, come titolare
                autonomo, secondo la{" "}
                <a
                  href="https://stripe.com/it/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sua informativa
                </a>
                . Puoi annullare una donazione mensile in qualsiasi momento, dal
                link di gestione nell’email di ringraziamento (quando presente)
                o scrivendoci.
              </p>
              <p>
                <strong>Visibilità del nome.</strong> Per impostazione
                predefinita il tuo nome non viene mostrato pubblicamente. Oggi
                il sito non pubblica elenchi di sostenitori; se il CIR deciderà
                di ringraziarli pubblicamente, userà solo il nome di chi ha
                scelto «Mostra il mio nome pubblicamente come sostenitore».
                Quella scelta vale come consenso esplicito e puoi ritirarla
                quando vuoi scrivendoci. Scegliere di non mostrare il nome non
                rende la donazione anonima per il CIR e per Stripe.
              </p>
              <p>
                <strong>Protezione da abusi.</strong> Per proteggere il modulo
                usiamo Cloudflare Turnstile, una verifica automatica che
                distingue le persone dai programmi automatici senza usare
                cookie, e un limite ai tentativi ravvicinati calcolato con
                codici ricavati dall’indirizzo IP e dall’email (servizio
                Upstash), che si cancellano da soli entro un’ora.
              </p>
              <Scheda
                dati="Nome, cognome, email, importo, frequenza (unica o mensile), preferenza sulla visibilità del nome e lingua del sito; i dati del pagamento gestiti da Stripe; i dati tecnici della verifica anti-abuso."
                perche={
                  <>
                    (a) ricevere e gestire la donazione, anche mensile; (b)
                    inviarti per email (tramite Resend) la conferma e il
                    ringraziamento; (c) rispettare gli obblighi contabili e
                    fiscali; (d) prevenire frodi e abusi del modulo.
                  </>
                }
                base={
                  <>
                    Per (a) e (b), l’esecuzione della donazione che ci chiedi
                    (art. 6, par. 1, lett. b GDPR); per (c), gli obblighi di
                    legge (lett. c); per (d), il legittimo interesse alla
                    sicurezza dei pagamenti (lett. f). L’eventuale pubblicazione
                    del nome si basa solo sul tuo consenso esplicito (art. 6,
                    par. 1, lett. a e art. 9, par. 2, lett. a).
                  </>
                }
                durata="10 anni dalla donazione, come previsto per le scritture contabili (art. 2220 del Codice civile). I codici anti-abuso si cancellano da soli entro un’ora."
                obbligo="Sì: i dati del modulo servono per effettuare la donazione e inviarti la conferma."
              />

              <h3>2.5 Statistiche di visita (solo con il tuo consenso)</h3>
              <p>
                Se accetti le statistiche nel banner, usiamo Vercel Web
                Analytics e Vercel Speed Insights per sapere quante persone
                visitano il sito, quali pagine leggono, da dove arrivano e
                quanto velocemente si caricano le pagine. Questi strumenti non
                usano cookie: i visitatori sono distinti con un codice
                temporaneo calcolato dalla richiesta, che si azzera ogni 24 ore,
                e noi vediamo solo dati aggregati. Se rifiuti, non vengono
                nemmeno caricati.
              </p>
              <Scheda
                dati="Pagina visitata e sito di provenienza, Paese e città approssimativi (ricavati dall’indirizzo IP, che non viene conservato), tipo di dispositivo, browser e sistema operativo, tempi di caricamento."
                perche="Capire quali contenuti sono utili e migliorare il sito."
                base={
                  <>
                    Il tuo consenso (art. 6, par. 1, lett. a GDPR e art. 122 del
                    Codice privacy), che puoi revocare in qualsiasi momento da
                    «Preferenze cookie» in fondo a ogni pagina.
                  </>
                }
                durata="Il codice temporaneo dura 24 ore; dopo restano solo statistiche aggregate e anonime."
                obbligo="No. Il sito funziona allo stesso modo anche se rifiuti."
              />

              <Titolo id="dati-religiosi">
                3. Dati che possono rivelare convinzioni religiose
              </Titolo>
              <p>
                Il CIR è un’associazione senza scopo di lucro con finalità
                religiose, culturali e sociali. Il fatto stesso di scriverci, di
                iscriverti alla newsletter o di sostenerci con una donazione
                potrebbe far presumere le tue convinzioni religiose, che il GDPR
                considera «categorie particolari di dati». Trattiamo questi dati
                solo per le finalità descritte in questa pagina, nell’ambito
                delle nostre legittime attività e con garanzie adeguate (art. 9,
                par. 2, lett. d GDPR). Non li comunichiamo a terzi senza il tuo
                consenso, salvo quanto necessario per i servizi che ci chiedi
                (ad esempio il pagamento tramite Stripe) o per obblighi di
                legge.
              </p>

              <Titolo id="destinatari">4. A chi comunichiamo i dati</Titolo>
              <p>
                I tuoi dati sono trattati da volontari e collaboratori del CIR
                autorizzati e tenuti alla riservatezza, e dai fornitori che ci
                aiutano a far funzionare il sito e i servizi, che agiscono per
                nostro conto come responsabili del trattamento (art. 28 GDPR):
              </p>
              <ul>
                <li>
                  <strong>Vercel Inc.</strong> (Stati Uniti): ospita il sito;
                  registri tecnici; statistiche di visita, solo con il tuo
                  consenso.
                </li>
                <li>
                  <strong>Stripe Payments Europe, Limited</strong> (Irlanda):
                  pagamenti delle donazioni (anche come titolare autonomo, vedi
                  sopra).
                </li>
                <li>
                  <strong>Cloudflare, Inc.</strong> (Stati Uniti): verifica
                  anti-abuso sul modulo di donazione.
                </li>
                <li>
                  <strong>Upstash, Inc.</strong> (Stati Uniti): limite ai
                  tentativi ripetuti sui moduli.
                </li>
                <li>
                  <strong>Resend</strong> (Stati Uniti): invio delle email del
                  modulo contatti e delle conferme di donazione.
                </li>
                <li>
                  <strong>Brevo</strong> (Francia): gestione e invio della
                  newsletter.
                </li>
                <li>
                  <strong>Google</strong> (Stati Uniti): casella di posta
                  elettronica del CIR, dove riceviamo i messaggi.
                </li>
              </ul>
              <p>
                Comunichiamo dati alle autorità pubbliche solo quando la legge
                lo impone. Non vendiamo né cediamo i tuoi dati a nessuno per
                scopi commerciali o pubblicitari. L’elenco aggiornato dei
                fornitori è disponibile su richiesta.
              </p>

              <Titolo id="trasferimenti">
                5. Trasferimenti fuori dall’Unione europea
              </Titolo>
              <p>
                Alcuni fornitori hanno sede negli Stati Uniti o possono trattare
                dati fuori dallo Spazio economico europeo. In questi casi il
                trasferimento avviene sulla base della decisione di adeguatezza
                della Commissione europea del 10 luglio 2023 (EU-U.S. Data
                Privacy Framework), per i fornitori certificati, oppure delle
                clausole contrattuali tipo approvate dalla Commissione (art. 46
                GDPR). Puoi chiederci informazioni sulle garanzie adottate
                scrivendo a {scrivici}.
              </p>

              <Titolo id="sicurezza">6. Come proteggiamo i dati</Titolo>
              <p>
                Il sito usa una connessione cifrata (HTTPS). L’accesso ai dati è
                limitato alle persone che ne hanno bisogno. I moduli sono
                protetti da invii automatici e ripetuti. Il CIR non conserva i
                dati completi delle carte di pagamento né gli IBAN.
              </p>

              <Titolo id="cookie">7. Cookie e strumenti simili</Titolo>
              <p>
                I cookie sono piccoli file che un sito salva nel tuo browser per
                ricordare informazioni durante la navigazione. Questo sito usa
                solo cookie tecnici, necessari per farlo funzionare, che non
                richiedono il tuo consenso (art. 122 del Codice privacy). Non
                usiamo cookie di profilazione né pubblicitari. Gli unici
                strumenti facoltativi sono le statistiche di visita, che non
                usano cookie e partono solo se le accetti.
              </p>
              <p>
                Ricordiamo la tua scelta per 6 mesi, poi te la chiediamo di
                nuovo. Te la chiederemo prima solo se cambiano gli strumenti che
                usiamo.
              </p>
            </Prose>

            <ElencoCookie className="my-8" />

            <Prose>
              <p>Puoi cambiare le tue scelte in qualsiasi momento:</p>
            </Prose>
            <div className="mt-4">
              <CookieSettingsButton />
            </div>

            <Prose className="mt-6">
              <p>
                Puoi anche cancellare o bloccare i cookie dalle impostazioni del
                browser; se blocchi quelli tecnici, alcune funzioni (come la
                donazione) potrebbero non funzionare. Nell’area riservata alla
                redazione si usano anche cookie tecnici di accesso (GitHub), che
                riguardano solo i redattori.
              </p>
              <p>
                <strong>Contenuti esterni e link.</strong> I caratteri
                tipografici sono ospitati sul nostro sito: la tua visita non
                comporta richieste a Google Fonts. I pulsanti per seguirci sui
                social, per condividere un articolo, per aggiungere un evento al
                calendario o per aprire una mappa sono semplici link: Facebook,
                Instagram, WhatsApp, Google e gli altri servizi ricevono dati
                solo se li apri, secondo le loro informative.
              </p>

              <Titolo id="diritti">8. I tuoi diritti</Titolo>
              <p>In qualsiasi momento puoi chiederci:</p>
              <ul>
                <li>
                  di accedere ai tuoi dati e di riceverne una copia (art. 15
                  GDPR);
                </li>
                <li>di correggerli o completarli (art. 16);</li>
                <li>
                  di cancellarli, ad esempio quando non servono più o se revochi
                  il consenso (art. 17);
                </li>
                <li>di limitarne il trattamento (art. 18);</li>
                <li>
                  di riceverli in un formato leggibile da un computer o di
                  trasmetterli a un altro titolare (art. 20);
                </li>
                <li>
                  di opporti ai trattamenti basati sul nostro legittimo
                  interesse (art. 21);
                </li>
                <li>
                  di revocare il consenso che ci hai dato, senza che questo
                  renda illecito il trattamento svolto fino a quel momento (art.
                  7).
                </li>
              </ul>
              <p>
                Per esercitare i tuoi diritti scrivi a {scrivici}. Ti
                risponderemo entro un mese; per le richieste più complesse il
                termine può essere prorogato di altri due mesi, e in quel caso
                ti avviseremo (art. 12 GDPR). Potremmo chiederti di confermare
                la tua identità.
              </p>
              <p>
                Se ritieni che il trattamento dei tuoi dati violi la normativa,
                puoi proporre reclamo al Garante per la protezione dei dati
                personali (
                <a
                  href="https://www.garanteprivacy.it"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  www.garanteprivacy.it
                </a>
                ) o rivolgerti all’autorità giudiziaria.
              </p>

              <Titolo id="decisioni-automatizzate">
                9. Decisioni automatizzate
              </Titolo>
              <p>
                Non prendiamo decisioni basate unicamente su trattamenti
                automatizzati che producano effetti giuridici su di te o ti
                riguardino in modo analogo (art. 22 GDPR). La verifica
                anti-abuso del modulo di donazione serve solo a distinguere le
                persone dai programmi automatici: se ti blocca per errore,
                riprova più tardi o scrivici.
              </p>

              <Titolo id="minori">10. Minori</Titolo>
              <p>
                Il sito non è rivolto ai minori di 14 anni e non raccogliamo
                consapevolmente i loro dati. Per iscriversi alla newsletter
                bisogna avere almeno 14 anni (art. 2-quinquies del Codice
                privacy). Se pensi che un minore ci abbia fornito dati, scrivici
                e li cancelleremo.
              </p>

              <Titolo id="modifiche">11. Modifiche a questa informativa</Titolo>
              <p>
                Potremo aggiornare questa informativa, ad esempio se aggiungiamo
                nuovi servizi o cambiano le norme. La data dell’ultimo
                aggiornamento è indicata in cima alla pagina. Se le modifiche
                riguardano gli strumenti facoltativi, ti chiederemo di nuovo il
                consenso.
              </p>
            </Prose>
          </div>
        </div>
      </Container>
    </main>
  );
}
