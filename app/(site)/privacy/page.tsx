import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";
import { LegalNotice } from "@/components/legal/LegalNotice";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Informativa sul trattamento dei dati personali della Comunità Islamica di Roma.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main id="contenuto">
      <PageHeader
        titolo="Informativa sulla privacy"
        crumbs={[{ label: "Home", href: "/" }, { label: "Privacy" }]}
      />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <LegalNotice />
          <Prose>
            <h2>Titolare del trattamento</h2>
            <p>
              Comunità Islamica di Roma (CIR). I dati di contatto del titolare
              saranno indicati qui non appena disponibili.
            </p>
            <h2>Dati raccolti</h2>
            <p>
              Tramite il modulo contatti raccogliamo nome, indirizzo email e il
              contenuto del messaggio, al solo scopo di rispondere alle tue
              richieste. Non vendiamo né cediamo i tuoi dati a terzi.
            </p>
            <h2>Finalità e base giuridica</h2>
            <p>
              I dati sono trattati per dare seguito alle comunicazioni inviate
              spontaneamente dall&apos;utente (esecuzione di misure
              precontrattuali e legittimo interesse a rispondere).
            </p>
            <h2>Conservazione</h2>
            <p>
              I messaggi sono conservati per il tempo necessario a gestire la
              richiesta e adempiere a eventuali obblighi di legge.
            </p>
            <h2>Diritti dell&apos;interessato</h2>
            <p>
              Puoi richiedere accesso, rettifica o cancellazione dei tuoi dati
              scrivendo ai recapiti del titolare.
            </p>
          </Prose>
        </div>
      </Container>
    </main>
  );
}
