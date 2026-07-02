import type { Metadata } from "next";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryPill } from "@/components/ui/CategoryPill";
import { Card } from "@/components/ui/Card";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { routing } from "@/i18n/routing";

// Pagina interna di ispezione componenti — fuori dagli indici dei motori.
// Non localizzata: strumento di sviluppo, non contenuto pubblico.
export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const swatches = [
  { name: "cream", var: "--color-cream", text: "text-ink" },
  { name: "cream-dark", var: "--color-cream-dark", text: "text-ink" },
  { name: "orange", var: "--color-orange", text: "text-ink" },
  { name: "orange-dark", var: "--color-orange-dark", text: "text-white" },
  { name: "teal", var: "--color-teal", text: "text-white" },
  { name: "teal-dark", var: "--color-teal-dark", text: "text-white" },
  { name: "ink", var: "--color-ink", text: "text-cream" },
  { name: "ink-soft", var: "--color-ink-soft", text: "text-cream" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10">
      <h2 className="mb-6 text-[length:var(--text-h2)] font-bold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <main id="contenuto" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="relative overflow-hidden rounded-2xl border border-border bg-cream-50 p-10">
        <div className="pointer-events-none absolute inset-0 text-teal opacity-[0.07]">
          <GeometricPattern />
        </div>
        <div className="relative">
          <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
            CIR · Design system
          </p>
          <h1 className="mt-2 text-[length:var(--text-h1)] font-bold text-ink">
            Styleguide
          </h1>
          <p className="mt-3 max-w-xl text-ink-soft">
            Inventario componenti e token. Pagina interna, non indicizzata.
          </p>
        </div>
      </header>

      <Section title="Colori">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map((s) => (
            <div
              key={s.name}
              className={`flex h-24 flex-col justify-end rounded-xl border border-border p-3 ${s.text}`}
              style={{ background: `var(${s.var})` }}
            >
              <span className="text-xs font-semibold">{s.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <SectionDivider />

      <Section title="Tipografia">
        <div className="space-y-3">
          <h1 className="text-[length:var(--text-h1)] font-bold text-ink">
            H1 — Uniti per una comunità forte
          </h1>
          <h2 className="text-[length:var(--text-h2)] font-bold text-ink">
            H2 — Fede che diventa azione
          </h2>
          <h3 className="text-[length:var(--text-h3)] font-semibold text-ink">
            H3 — Servizio alla comunità
          </h3>
          <p className="max-w-2xl text-base leading-relaxed text-ink">
            Body — La Comunità Islamica di Roma nasce dall&apos;incontro tra
            giovani, famiglie, responsabili di centri e associazioni.
          </p>
          <p className="max-w-2xl font-serif text-lg leading-relaxed text-ink">
            Serif (corpo articoli) — Da 77 anni assistiamo a un&apos;ingiustizia
            che continua senza sosta.
          </p>
        </div>
      </Section>

      <SectionDivider accent="teal" />

      <Section title="Bottoni">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">
            Dona ora <ArrowRight size={16} />
          </Button>
          <Button variant="secondary">Scopri chi siamo</Button>
          <Button variant="ghost">I prossimi eventi</Button>
          <Button variant="primary" size="sm">
            Piccolo
          </Button>
          <Button variant="primary" size="lg">
            Grande
          </Button>
        </div>
      </Section>

      <SectionDivider />

      <Section title="Pill categorie">
        <div className="flex flex-wrap gap-3">
          <CategoryPill color="teal">Islam e Media</CategoryPill>
          <CategoryPill color="orange">Donne nell&apos;Islam</CategoryPill>
          <CategoryPill color="teal">Corano e Scienza</CategoryPill>
          <CategoryPill color="orange">Palestina</CategoryPill>
        </div>
      </Section>

      <SectionDivider accent="teal" />

      <Section title="Card">
        <div className="grid gap-5 sm:grid-cols-2">
          <Card className="overflow-hidden">
            <div className="aspect-[16/9] bg-cream-dark" />
            <div className="p-5">
              <CategoryPill color="orange">Festività</CategoryPill>
              <h3 className="mt-3 text-lg font-bold text-ink">
                Festa del Eid Al-Adha
              </h3>
              <div className="mt-2 flex flex-col gap-1 text-sm text-ink-soft">
                <span className="flex items-center gap-2">
                  <Calendar size={15} /> 31 maggio 2026
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={15} /> Villa Gordiani, Roma
                </span>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-ink-soft">
              Card generica come base per EventCard e ArticleCard.
            </p>
          </Card>
        </div>
      </Section>

      <SectionDivider />

      <Section title="Motivo geometrico">
        <div className="relative h-40 overflow-hidden rounded-xl border border-border bg-cream-50 text-orange">
          <GeometricPattern id="sg-pattern" />
        </div>
      </Section>
    </main>
  );
}
