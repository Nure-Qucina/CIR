import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FoglioSezione } from "@/components/carta/FoglioSezione";
import { ILLUSTRAZIONI } from "@/lib/carta";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils/cn";

/** Inclinazioni dei foglietti "cosa facciamo", a rotazione. */
const STORTI = [
  "-rotate-[1.5deg]",
  "rotate-[1deg]",
  "-rotate-[0.5deg]",
  "rotate-[1.8deg]",
  "-rotate-[1.2deg]",
];

/**
 * Blocco "Media e Comunicazione" (sezione F della home): foglio teal con i
 * microfoni di carta protagonisti, titolo, una frase, le attività come
 * foglietti di carta da leggere al volo e una sola frase-manifesto (l'ultima
 * di "perché comunichiamo"). Testi in messages/*.json, namespace
 * "istituzionale.media".
 */
export async function MediaBlock({ locale }: { locale: Locale }) {
  const [t, tc, ti] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "istituzionale" }),
  ]);
  const perche = ti.raw("media.perche") as string[];
  const cosa = ti.raw("media.cosa") as string[];
  const manifesto = perche[perche.length - 1];
  const { microfoni } = ILLUSTRAZIONI;
  return (
    <FoglioSezione tono="teal" className="overflow-hidden">
      <Container className="relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="relative mx-auto w-[64%] max-w-[340px] lg:w-full lg:max-w-none">
          <Image
            src={microfoni.src}
            width={microfoni.width}
            height={microfoni.height}
            alt=""
            sizes="(max-width: 1024px) 64vw, 420px"
            className="ritaglio h-auto w-full -rotate-[4deg]"
          />
          {manifesto && (
            <p className="mt-6 text-center font-serif text-xl text-orange-200 italic sm:text-2xl">
              «{manifesto.replace(/\.$/, "")}»
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold tracking-[0.2em] text-orange-200 uppercase">
            {t("mediaOcchiello")}
          </p>
          <h2 className="mt-3 text-[length:var(--text-h2)] font-bold text-balance">
            {t("mediaTitolo")}
          </h2>
          <p className="text-cream/85 mt-4 max-w-xl">{t("mediaSottotitolo")}</p>

          <h3 className="sr-only">{t("cosaFacciamo")}</h3>
          <ul className="mt-7 flex flex-wrap gap-3">
            {cosa.map((c, i) => (
              <li
                key={c}
                className={cn(
                  "text-ink bg-cream-50 rounded-[3px] px-3.5 py-2 text-sm font-semibold shadow-[0_6px_14px_rgb(20_30_28/0.3)]",
                  STORTI[i % STORTI.length],
                )}
              >
                {c.replace(/\.$/, "")}
              </li>
            ))}
          </ul>

          <Button href="/contatti" variant="primary" className="mt-8">
            {tc("contattaci")}
          </Button>
        </div>
      </Container>
    </FoglioSezione>
  );
}
