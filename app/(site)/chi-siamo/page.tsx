import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { ValueCard } from "@/components/home/ValueCard";
import { StoriaTimeline } from "@/components/home/StoriaTimeline";
import { Button } from "@/components/ui/Button";
import {
  MISSION,
  VALORI,
  STORIA,
  CHI_SIAMO_INTRO,
  CHI_SIAMO_PUNTI,
  DATO_ASSOCIAZIONI,
} from "@/lib/data/cir";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "La Comunità Islamica di Roma è una rete di 22 associazioni: coordinamento, rappresentanza e dialogo per i musulmani della capitale.",
};

export default function ChiSiamoPage() {
  return (
    <main id="contenuto">
      <PageHeader
        occhiello="La nostra identità"
        titolo="Una rete, una voce, una responsabilità condivisa"
        sottotitolo={MISSION}
        crumbs={[{ label: "Home", href: "/" }, { label: "Chi siamo" }]}
      />

      <Container className="py-12 sm:py-16">
        {/* Intro + dato chiave */}
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="text-lg leading-relaxed text-ink">
            <p>{CHI_SIAMO_INTRO}</p>
            <ul className="mt-6 space-y-3">
              {CHI_SIAMO_PUNTI.map((p) => (
                <li key={p} className="flex gap-3">
                  <Check
                    size={20}
                    className="mt-1 shrink-0 text-orange"
                    aria-hidden
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-teal p-8 text-cream">
            <p className="text-5xl font-bold">{DATO_ASSOCIAZIONI}</p>
            <p className="mt-2 font-semibold">
              associazioni islamiche rappresentate
            </p>
            <p className="mt-1 text-sm text-cream/80">
              attive a Roma, in continua crescita.
            </p>
          </div>
        </div>

        <SectionDivider className="my-14" />

        {/* Valori */}
        <section aria-labelledby="valori-heading">
          <h2
            id="valori-heading"
            className="text-[length:var(--text-h2)] font-bold text-ink"
          >
            I nostri valori
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {VALORI.map((v, i) => (
              <ValueCard key={v.titolo} valore={v} index={i} />
            ))}
          </div>
        </section>

        <SectionDivider accent="teal" className="my-14" />

        {/* Storia */}
        <section aria-labelledby="storia-heading">
          <h2
            id="storia-heading"
            className="text-[length:var(--text-h2)] font-bold text-ink"
          >
            La nostra storia
          </h2>
          <div className="mt-8 max-w-2xl">
            <StoriaTimeline momenti={STORIA} />
          </div>
        </section>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl border border-border bg-cream-50 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-ink">
              Vuoi conoscerci o collaborare?
            </p>
            <p className="mt-1 text-ink-soft">
              Siamo aperti al dialogo con cittadini, istituzioni e media.
            </p>
          </div>
          <Button href="/contatti">Contattaci</Button>
        </div>
      </Container>
    </main>
  );
}
