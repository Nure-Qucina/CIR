import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import Image from "next/image";
import { FoglioSezione } from "@/components/carta/FoglioSezione";
import { ValoriArcate } from "@/components/home/ValoriArcate";
import { StoriaSentiero } from "@/components/home/StoriaSentiero";
import { Button } from "@/components/ui/Button";
import { ILLUSTRAZIONI } from "@/lib/carta";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";
import {
  DATO_ASSOCIAZIONI,
  type Valore,
  type MomentoStoria,
} from "@/lib/data/cir";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Chi siamo",
    description:
      "La Comunità Islamica di Roma è una rete di 22 associazioni: coordinamento, rappresentanza e dialogo per i musulmani della capitale.",
    alternates: buildAlternates("/chi-siamo", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
  };
}

export default async function ChiSiamoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, tc, tNav, ti] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "chiSiamo" }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getTranslations({ locale: locale as Locale, namespace: "nav" }),
    getTranslations({ locale: locale as Locale, namespace: "istituzionale" }),
  ]);
  const valori = ti.raw("valori") as Valore[];
  const storia = ti.raw("storia") as MomentoStoria[];
  const chiSiamoPunti = ti.raw("chiSiamoPunti") as string[];

  return (
    <main id="contenuto">
      <PageHeader
        occhiello={t("occhiello")}
        titolo={t("titolo")}
        sottotitolo={ti("mission")}
        crumbs={[{ label: tc("home"), href: "/" }, { label: tNav("chiSiamo") }]}
        illustrazione="treccia"
      />

      {/* Intro + dato chiave */}
      <Container className="pb-12 sm:pb-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="text-ink text-lg leading-relaxed">
            <p>{ti("chiSiamoIntro")}</p>
            <ul className="mt-6 space-y-3">
              {chiSiamoPunti.map((p) => (
                <li key={p} className="flex gap-3">
                  <Check
                    size={20}
                    className="text-orange mt-1 shrink-0"
                    aria-hidden
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="carta-teal rotate-[1deg] rounded-md p-8 shadow-[0_18px_36px_rgb(20_30_28/0.3)]">
            <p className="text-6xl font-bold">{DATO_ASSOCIAZIONI}</p>
            <p className="mt-2 font-semibold">
              {t("associazioniRappresentate")}
            </p>
            <p className="text-cream/80 mt-1 text-sm">
              {t("associazioniSottotitolo")}
            </p>
          </div>
        </div>
      </Container>

      {/* Valori: le quattro arcate su foglio teal */}
      <FoglioSezione tono="teal" aria-labelledby="valori-heading">
        <Container className="py-12 sm:py-16">
          <h2
            id="valori-heading"
            className="mb-10 text-center text-[length:var(--text-h2)] font-bold"
          >
            {t("valoriTitolo")}
          </h2>
          <ValoriArcate valori={valori} />
        </Container>
      </FoglioSezione>

      {/* Storia: il sentiero a tappe */}
      <section aria-labelledby="storia-heading">
        <Container className="py-16 sm:py-20">
          <h2
            id="storia-heading"
            className="text-ink mb-8 text-center text-[length:var(--text-h2)] font-bold"
          >
            {t("storiaTitolo")}
          </h2>
          <StoriaSentiero momenti={storia} />
        </Container>
      </section>

      {/* CTA */}
      <Container>
        <div className="foglio relative flex flex-col items-start gap-4 p-8 pe-8 sm:flex-row sm:items-center sm:justify-between sm:pe-40 lg:pe-48">
          <div>
            <p className="text-ink text-lg font-bold">{t("ctaTitolo")}</p>
            <p className="text-ink-soft mt-1">{t("ctaSottotitolo")}</p>
          </div>
          <Button href="/contatti">{tc("contattaci")}</Button>
          <Image
            src={ILLUSTRAZIONI.busta.src}
            width={ILLUSTRAZIONI.busta.width}
            height={ILLUSTRAZIONI.busta.height}
            alt=""
            sizes="140px"
            className="ritaglio pointer-events-none absolute -end-3 -top-10 hidden h-auto w-28 rotate-[8deg] sm:block lg:w-36"
          />
        </div>
      </Container>
    </main>
  );
}
