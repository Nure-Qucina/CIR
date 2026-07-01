import { Heart, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { GeometricPattern } from "@/components/ui/GeometricPattern";

/**
 * Banner donazioni (sezione G): CTA "Dona ora" → LaunchGood (link reale §8).
 */
export function DonateBanner({ donazioniUrl }: { donazioniUrl: string }) {
  return (
    <Container className="py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-orange-200 bg-orange-50 p-8 sm:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 text-orange opacity-[0.07]"
        >
          <GeometricPattern size={72} id="donate-girih" />
        </div>
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-orange/15 px-3 py-1 text-sm font-semibold text-orange-800">
              <Heart size={15} aria-hidden />
              Sostieni il CIR
            </span>
            <h2 className="mt-3 text-[length:var(--text-h2)] font-bold text-balance text-ink">
              Il tuo contributo fa crescere la comunità
            </h2>
            <p className="mt-3 text-ink-soft">
              Ogni donazione ci aiuta a dare voce ai musulmani di Roma, a
              organizzare eventi e a costruire dialogo. Anche un piccolo gesto
              conta.
            </p>
          </div>
          <a
            href={donazioniUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-orange px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-orange-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Dona ora
            <ArrowRight size={18} aria-hidden />
          </a>
        </div>
      </div>
    </Container>
  );
}
