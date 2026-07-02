import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import type { Locale } from "@/i18n/routing";

/**
 * Blocco "Media e Comunicazione" (sezione F della home): fondo teal istituzionale,
 * perché comunichiamo / cosa facciamo + CTA per giornalisti. Le liste vivono
 * in messages/it.json (namespace "istituzionale.media") — vedi HeroCentered.
 */
export async function MediaBlock({ locale }: { locale: Locale }) {
  const [t, tc, ti] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "istituzionale" }),
  ]);
  const perche = ti.raw("media.perche") as string[];
  const cosa = ti.raw("media.cosa") as string[];
  return (
    <section className="relative overflow-hidden bg-teal text-cream">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 text-cream opacity-[0.05]"
      >
        <GeometricPattern size={88} id="media-girih" />
      </div>
      <Container className="relative py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-orange-200 uppercase">
              {t("mediaOcchiello")}
            </p>
            <h2 className="mt-3 text-[length:var(--text-h2)] font-bold text-balance">
              {t("mediaTitolo")}
            </h2>
            <p className="mt-4 max-w-md text-cream/85">
              {t("mediaSottotitolo")}
            </p>
            <Button
              href="/contatti"
              variant="primary"
              className="mt-6"
            >
              {tc("contattaci")}
            </Button>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-cream">
                {t("percheComunichiamo")}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-cream/85">
                {perche.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-orange-200" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-cream">{t("cosaFacciamo")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-cream/85">
                {cosa.map((c) => (
                  <li key={c} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-orange-200" aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
