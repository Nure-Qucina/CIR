import { getTranslations } from "next-intl/server";
import { ArrowRight, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { DATO_ASSOCIAZIONI } from "@/lib/data/cir";
import type { Locale } from "@/i18n/routing";

/**
 * Hero — Direzione A: "Centrata e monumentale".
 * Composizione simmetrica, headline ampia al centro, watermark geometrico dietro,
 * cornice decorativa. Tono istituzionale e solenne. Text-first (LCP = h1).
 *
 * Payoff (H1) e mission sono testi istituzionali (messages/it.json, namespace
 * "istituzionale"): l'italiano è la sorgente, le altre lingue partono da
 * placeholder [EN]/[AR]/[BN] finché non arrivano traduzioni revisionate
 * (vedi §12 del brief i18n — non si auto-traduce contenuto istituzionale).
 */
export async function HeroCentered({ locale }: { locale: Locale }) {
  const [t, tc, ti] = await Promise.all([
    getTranslations({ locale, namespace: "hero" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "istituzionale" }),
  ]);

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
              {t("occhiello")}
            </p>
            <span className="h-px w-8 bg-orange/60" />
          </div>

          <h1 className="text-[length:var(--text-h1)] leading-[1.08] font-bold text-balance text-ink">
            {ti("payoff")}
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-ink-soft">
            {ti("mission")}
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button href="/chi-siamo" size="lg">
              {t("scopriChiSiamo")}
              <ArrowRight size={18} className="rtl:rotate-180" aria-hidden />
            </Button>
            <Button href="/eventi" variant="ghost" size="lg">
              {t("iProssimiEventi")}
            </Button>
          </div>

          {/* Trust marker */}
          <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-cream-50 px-4 py-2 text-sm font-semibold text-ink">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-teal text-xs text-cream">
              {DATO_ASSOCIAZIONI}
            </span>
            {t("associazioniRappresentate")}
            <span className="text-ink-200" aria-hidden>
              ·
            </span>
            <MapPin size={14} className="text-teal" aria-hidden />
            {tc("roma")}
          </div>
        </div>
      </Container>
    </section>
  );
}
