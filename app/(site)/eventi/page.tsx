import { Suspense } from "react";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { EventTimeline } from "@/components/eventi/EventTimeline";
import { getEventi } from "@/lib/content/eventi";

export const metadata: Metadata = {
  title: "Eventi",
  description:
    "Gli appuntamenti della Comunità Islamica di Roma: incontri, festività e iniziative aperte alla città. Prossimi eventi e archivio.",
};

// ISR: rigenera ogni ora.
export const revalidate = 3600;

export default async function EventiPage() {
  const eventi = await getEventi();

  return (
    <main id="contenuto">
      <PageHeader
        occhiello="Vita della comunità"
        titolo="Eventi"
        sottotitolo="Incontri, festività e iniziative aperte a tutta la città. Aggiungi gli appuntamenti al tuo calendario e partecipa."
      />
      <Container className="py-12 sm:py-16">
        <Suspense fallback={null}>
          <EventTimeline eventi={eventi} />
        </Suspense>
      </Container>
    </main>
  );
}
