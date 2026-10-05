import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { DATO_ASSOCIAZIONI } from "@/lib/data/cir";
import { ILLUSTRAZIONI } from "@/lib/carta";
import type { Locale } from "@/i18n/routing";

/**
 * Hero "Il foglio": titolo a sinistra, a destra la finestra ad arco di carta
 * con dentro Roma (acquedotto, pini, cupola, minareto), i fumetti che le
 * girano intorno e il cartellino delle associazioni. Text-first: l'LCP resta
 * l'h1, la finestra ha priority perché è sopra la piega su desktop.
 *
 * Payoff e mission sono testi istituzionali (messages/*.json, namespace
 * "istituzionale"): vedi §12 del brief i18n.
 */
export async function HeroFoglio({ locale }: { locale: Locale }) {
  const [t, ti] = await Promise.all([
    getTranslations({ locale, namespace: "hero" }),
    getTranslations({ locale, namespace: "istituzionale" }),
  ]);
  const { finestra, fumettoArancio, fumettoTeal } = ILLUSTRAZIONI;

  return (
    <section className="bg-cream relative overflow-hidden">
      <Container className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:py-20">
        <div>
          <p className="text-sm font-semibold tracking-[0.22em] text-orange-700 uppercase">
            {t("occhiello")}
          </p>
          <h1 className="text-ink mt-4 text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.06] font-bold text-balance">
            {ti("payoff")}
          </h1>
          <p className="text-ink-soft mt-6 max-w-xl text-lg leading-relaxed text-pretty">
            {ti("mission")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/chi-siamo" size="lg">
              {t("scopriChiSiamo")}
              <ArrowRight size={18} className="rtl:rotate-180" aria-hidden />
            </Button>
            <Button href="/eventi" variant="ghost" size="lg">
              {t("iProssimiEventi")}
            </Button>
          </div>
        </div>

        {/* Composizione di ritagli. Il cartellino fa parte dell'illustrazione
            (legato al bordo della finestra): qui sopra c'è solo il testo,
            in unità del contenitore così scala insieme all'immagine. */}
        <div className="@container relative mx-auto w-[min(94%,420px)] lg:w-[82%]">
          <Image
            src={finestra.src}
            width={finestra.width}
            height={finestra.height}
            alt=""
            priority
            sizes="(max-width: 1024px) 94vw, 460px"
            className="ritaglio h-auto w-full"
          />
          <Image
            src={fumettoArancio.src}
            width={fumettoArancio.width}
            height={fumettoArancio.height}
            alt=""
            sizes="140px"
            className="ritaglio carta-galleggia absolute top-[30%] -left-[5%] h-auto w-[28%] lg:-left-[14%]"
          />
          <Image
            src={fumettoTeal.src}
            width={fumettoTeal.width}
            height={fumettoTeal.height}
            alt=""
            sizes="120px"
            className="ritaglio carta-galleggia absolute top-[16%] -right-[10%] h-auto w-[22%] [animation-delay:-3s]"
          />
          {/* Testo del cartellino (area misurata sull'illustrazione). "Rappresentiamo"
              è in serif corsivo, più stretto, così sta intero nella larghezza. */}
          <p className="text-cream absolute top-[47%] right-[2.5%] bottom-[25%] left-[76.5%] flex flex-col items-center justify-center text-center leading-none">
            <span className="font-serif text-[2.7cqw] italic">
              {t("rappresentiamo")}
            </span>
            <span className="mt-[0.8cqw] font-serif text-[12cqw] font-semibold tracking-tight">
              {DATO_ASSOCIAZIONI}
            </span>
            <span className="mt-[0.6cqw] text-[2.6cqw] font-semibold tracking-wide">
              {t("associazioni")}
            </span>
          </p>
        </div>
      </Container>
    </section>
  );
}
