import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FoglioSezione } from "@/components/carta/FoglioSezione";
import { ILLUSTRAZIONI } from "@/lib/carta";
import type { Locale } from "@/i18n/routing";

/**
 * Blocco "Media e Comunicazione" (sezione F della home): foglio teal con i
 * microfoni di carta che escono dal bordo inferiore. Le liste vivono in
 * messages/*.json (namespace "istituzionale.media").
 */
export async function MediaBlock({ locale }: { locale: Locale }) {
  const [t, tc, ti] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "istituzionale" }),
  ]);
  const perche = ti.raw("media.perche") as string[];
  const cosa = ti.raw("media.cosa") as string[];
  const { microfoni } = ILLUSTRAZIONI;
  return (
    <FoglioSezione tono="teal" className="overflow-hidden">
      <Container className="relative grid gap-10 pt-12 sm:pt-16 lg:grid-cols-[1fr_1.15fr_0.75fr] lg:items-end">
        <div className="lg:self-start">
          <p className="text-sm font-semibold tracking-[0.2em] text-orange-200 uppercase">
            {t("mediaOcchiello")}
          </p>
          <h2 className="mt-3 text-[length:var(--text-h2)] font-bold text-balance">
            {t("mediaTitolo")}
          </h2>
          <p className="text-cream/85 mt-4 max-w-md">{t("mediaSottotitolo")}</p>
          <Button href="/contatti" variant="primary" className="mt-6">
            {tc("contattaci")}
          </Button>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:self-start">
          <div>
            <h3 className="text-cream font-semibold">
              {t("percheComunichiamo")}
            </h3>
            <ul className="text-cream/85 mt-3 space-y-2 text-sm">
              {perche.map((p) => (
                <li key={p} className="flex gap-2">
                  <Check
                    size={16}
                    className="mt-0.5 shrink-0 text-orange-200"
                    aria-hidden
                  />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-cream font-semibold">{t("cosaFacciamo")}</h3>
            <ul className="text-cream/85 mt-3 space-y-2 text-sm">
              {cosa.map((c) => (
                <li key={c} className="flex gap-2">
                  <Check
                    size={16}
                    className="mt-0.5 shrink-0 text-orange-200"
                    aria-hidden
                  />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* I microfoni "affondano" nello strappo di chiusura. */}
        <Image
          src={microfoni.src}
          width={microfoni.width}
          height={microfoni.height}
          alt=""
          sizes="(max-width: 1024px) 70vw, 280px"
          className="ritaglio mx-auto -mb-[14%] h-auto w-[70%] max-w-[340px] lg:-mb-[22%] lg:w-full"
        />
      </Container>
    </FoglioSezione>
  );
}
