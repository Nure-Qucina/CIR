import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Prose } from "@/components/ui/Prose";
import { LegalNotice } from "@/components/legal/LegalNotice";

export const metadata: Metadata = {
  title: "Cookie",
  description: "Informativa sull'uso dei cookie sul sito della Comunità Islamica di Roma.",
};

export default function CookiePage() {
  return (
    <main id="contenuto">
      <PageHeader
        titolo="Informativa sui cookie"
        crumbs={[{ label: "Home", href: "/" }, { label: "Cookie" }]}
      />
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <LegalNotice />
          <Prose>
            <h2>Cosa sono i cookie</h2>
            <p>
              I cookie sono piccoli file di testo che i siti salvano sul
              dispositivo dell&apos;utente per farlo funzionare o per raccogliere
              statistiche di utilizzo.
            </p>
            <h2>Cookie utilizzati</h2>
            <p>
              Questo sito è progettato per ridurre al minimo i cookie. Vengono
              utilizzati solo cookie tecnici necessari al funzionamento. Eventuali
              strumenti di analisi sono privacy-friendly e, dove possibile,
              anonimizzati e senza profilazione.
            </p>
            <h2>Gestione delle preferenze</h2>
            <p>
              Puoi gestire o eliminare i cookie dalle impostazioni del tuo
              browser. La disattivazione dei cookie tecnici può compromettere
              alcune funzionalità del sito.
            </p>
          </Prose>
        </div>
      </Container>
    </main>
  );
}
