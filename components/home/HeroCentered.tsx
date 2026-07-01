import { ArrowRight, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { MISSION, DATO_ASSOCIAZIONI } from "@/lib/data/cir";

/**
 * Hero — Direzione A: "Centrata e monumentale".
 * Composizione simmetrica, headline ampia al centro, watermark geometrico dietro,
 * cornice decorativa. Tono istituzionale e solenne. Text-first (LCP = h1).
 */
export function HeroCentered() {
  return (
    <section className="relative overflow-hidden bg-cream">
      {/* Watermark geometrico centrale, molto leggero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-teal opacity-[0.06]"
      >
        <GeometricPattern size={96} id="hero-a-girih" />
      </div>
      {/* Aloni caldi per profondità */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-orange/10 blur-3xl"
      />

      <Container className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          {/* Cornice/occhiello decorativo */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-orange/60" />
            <p className="text-sm font-semibold tracking-[0.22em] text-orange uppercase">
              Comunità Islamica di Roma
            </p>
            <span className="h-px w-8 bg-orange/60" />
          </div>

          <h1 className="text-[length:var(--text-h1)] leading-[1.08] font-bold text-balance text-ink">
            Uniti per una comunità forte e consapevole
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-ink-soft">
            {MISSION}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="/chi-siamo" size="lg">
              Scopri chi siamo
              <ArrowRight size={18} aria-hidden />
            </Button>
            <Button href="/eventi" variant="ghost" size="lg">
              I prossimi eventi
            </Button>
          </div>

          {/* Trust marker */}
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-cream-50 px-4 py-2 text-sm font-semibold text-ink">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-teal text-xs text-cream">
              {DATO_ASSOCIAZIONI}
            </span>
            associazioni rappresentate
            <span className="text-ink-200" aria-hidden>
              ·
            </span>
            <MapPin size={14} className="text-teal" aria-hidden />
            Roma
          </div>
        </div>
      </Container>
    </section>
  );
}
