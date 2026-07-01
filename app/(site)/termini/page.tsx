import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";
import { LegalNotice } from "@/components/legal/LegalNotice";

export const metadata: Metadata = {
  title: "Termini",
  description: "Termini e condizioni d'uso del sito della Comunità Islamica di Roma.",
};

export default function TerminiPage() {
  return (
    <main id="contenuto">
      <PageHeader
        titolo="Termini e condizioni"
        crumbs={[{ label: "Home", href: "/" }, { label: "Termini" }]}
      />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <LegalNotice />
          <Prose>
            <h2>Uso del sito</h2>
            <p>
              I contenuti di questo sito hanno finalità informative e
              istituzionali. Ci impegniamo a mantenerli accurati e aggiornati, ma
              non garantiamo l&apos;assenza di errori o omissioni.
            </p>
            <h2>Proprietà intellettuale</h2>
            <p>
              Testi, marchi e materiali grafici appartengono alla Comunità
              Islamica di Roma, salvo diversa indicazione. Non è consentita la
              riproduzione senza autorizzazione.
            </p>
            <h2>Link esterni</h2>
            <p>
              Il sito può contenere collegamenti a siti di terzi (es. donazioni,
              social). Non siamo responsabili dei loro contenuti o delle loro
              politiche sulla privacy.
            </p>
          </Prose>
        </div>
      </Container>
    </main>
  );
}
