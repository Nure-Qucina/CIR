import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { ILLUSTRAZIONI } from "@/lib/carta";
import type { Locale } from "@/i18n/routing";
import { NewsletterForm } from "./NewsletterForm";

/**
 * Sezione newsletter della home (tra l'evento e Media): la busta di carta con
 * l'aeroplanino che ne vola via, titolo e modulo di iscrizione (double opt-in
 * Brevo, vedi newsletter/actions.ts).
 */
export async function NewsletterBlock({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "newsletterForm" });
  const { busta, aeroplanino } = ILLUSTRAZIONI;
  return (
    <section aria-labelledby="newsletter-home">
      <Container className="grid items-center gap-10 py-16 sm:py-20 md:grid-cols-[0.8fr_1.2fr] md:gap-14">
        <div className="relative mx-auto w-[60%] max-w-[300px] md:w-full">
          <Image
            src={busta.src}
            width={busta.width}
            height={busta.height}
            alt=""
            sizes="(max-width: 768px) 60vw, 300px"
            className="ritaglio h-auto w-full -rotate-[5deg]"
          />
          <Image
            src={aeroplanino.src}
            width={aeroplanino.width}
            height={aeroplanino.height}
            alt=""
            sizes="140px"
            className="ritaglio carta-galleggia absolute -top-[14%] -right-[18%] h-auto w-[42%] rotate-[8deg]"
          />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
            {t("occhiello")}
          </p>
          <h2
            id="newsletter-home"
            className="text-ink mt-3 text-[length:var(--text-h2)] font-bold text-balance"
          >
            {t("titolo")}
          </h2>
          <p className="text-ink-soft mt-3 max-w-xl">{t("sottotitolo")}</p>
          <NewsletterForm />
        </div>
      </Container>
    </section>
  );
}
