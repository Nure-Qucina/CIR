import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";
import { CookieSettingsButton } from "@/components/legal/CookieSettingsButton";
import { getSiteConfig } from "@/lib/content/site";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "legal" });
  return {
    title: t("privacyCookie"),
    description:
      "Informativa privacy e cookie della Comunità Islamica di Roma (CIR), ai sensi del Regolamento UE 2016/679 (GDPR).",
    robots: { index: true, follow: true },
    alternates: buildAlternates("/privacy", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
  };
}

/**
 * Informativa Privacy e Cookie (pagina legale unica). Struttura in 7 punti.
 * Il testo è in italiano (contenuto legale — non si auto-traduce, vedi §12 del
 * brief i18n): solo la chrome di pagina (titolo, breadcrumb) è localizzata. I
 * dati del titolare (nome, CF, sede, email) arrivano dalla config del sito
 * (Keystatic), così restano in un unico posto ed editabili senza toccare il codice.
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
  const email = contatti.email;
  const indirizzo = contatti.indirizzo;

  return (
    <main id="contenuto">
      <PageHeader
        titolo={t("privacyCookie")}
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: t("privacyCookie") },
        ]}
      />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-8 text-sm text-ink-soft">
            Ultimo aggiornamento: luglio 2026. Informativa resa ai sensi degli
            artt. 13-14 del Regolamento UE 2016/679 (GDPR). Si consiglia una
            revisione da parte di un consulente legale prima della pubblicazione
            definitiva.
          </p>

          <Prose>
            <h2>1. Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento dei dati è {nome} ({sigla})
              {codiceFiscale ? `, Codice Fiscale ${codiceFiscale}` : ""}
              {indirizzo ? `, con sede in ${indirizzo}` : ""}. Per qualsiasi
              richiesta relativa ai tuoi dati puoi scrivere a{" "}
              {email ? (
                <a href={`mailto:${email}`}>{email}</a>
              ) : (
                "i recapiti indicati nella pagina contatti"
              )}
              .
            </p>

            <h2>2. Dati raccolti</h2>
            <p>
              Trattiamo i dati personali che ci fornisci volontariamente —
              ad esempio tramite il modulo di contatto, moduli di iscrizione,
              newsletter o eventuali donazioni — quali nome, indirizzo email,
              telefono e il contenuto del messaggio. Trattiamo inoltre i dati
              tecnici di navigazione raccolti tramite cookie (vedi punto 5).
            </p>

            <h2>3. Finalità e base giuridica</h2>
            <p>
              I dati sono trattati per rispondere alle richieste di
              informazioni, per gestire le attività istituzionali, culturali e
              sociali dell&apos;associazione e per gestire l&apos;eventuale
              rapporto associativo. La base giuridica è il consenso
              dell&apos;interessato e/o l&apos;esecuzione di misure
              precontrattuali e contrattuali legate alla vita associativa.
            </p>

            <h2>4. Modalità e conservazione</h2>
            <p>
              I dati sono trattati con strumenti informatici e con misure di
              sicurezza adeguate a proteggerli. Sono conservati solo per il
              tempo necessario a conseguire le finalità associative sopra
              indicate e ad adempiere agli obblighi di legge.
            </p>

            <h2>5. Cookie</h2>
            <p>Il sito utilizza le seguenti categorie di cookie:</p>
            <ul>
              <li>
                <strong>Necessari:</strong> indispensabili al funzionamento del
                sito. Sempre attivi.
              </li>
              <li>
                <strong>Statistiche:</strong> raccolgono informazioni anonime
                sulle visite al sito. Attivati solo con il tuo consenso.
              </li>
              <li>
                <strong>Marketing:</strong> per eventuali contenuti di terze
                parti. Attivati solo con il tuo consenso.
              </li>
            </ul>
            <p>Puoi modificare le tue preferenze in qualsiasi momento:</p>
          </Prose>

          <div className="mt-4">
            <CookieSettingsButton />
          </div>

          <Prose className="mt-10">
            <h2>6. Diritti dell&apos;interessato</h2>
            <p>
              Ai sensi degli artt. 15-22 del GDPR hai il diritto di accedere ai
              tuoi dati, chiederne la rettifica o la cancellazione, limitarne od
              opporti al trattamento e richiederne la portabilità. Hai inoltre
              il diritto di proporre reclamo al Garante per la protezione dei
              dati personali.
            </p>

            <h2>7. Contatti</h2>
            <p>
              Per esercitare i tuoi diritti o per qualsiasi informazione sul
              trattamento dei dati, contatta {nome}
              {email ? (
                <>
                  {" "}
                  all&apos;indirizzo <a href={`mailto:${email}`}>{email}</a>
                </>
              ) : (
                " tramite i recapiti indicati nella pagina contatti"
              )}
              .
            </p>
          </Prose>
        </div>
      </Container>
    </main>
  );
}
