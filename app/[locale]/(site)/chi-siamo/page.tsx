import type { Metadata } from "next";
import { Check } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { ValueCard } from "@/components/home/ValueCard";
import { StoriaTimeline } from "@/components/home/StoriaTimeline";
import { Button } from "@/components/ui/Button";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";
import { DATO_ASSOCIAZIONI, type Valore, type MomentoStoria } from "@/lib/data/cir";

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
        crumbs={[
          { label: tc("home"), href: "/" },
          { label: tNav("chiSiamo") },
        ]}
      />

      <Container className="py-12 sm:py-16">
        {/* Intro + dato chiave */}
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="text-lg leading-relaxed text-ink">
            <p>{ti("chiSiamoIntro")}</p>
            <ul className="mt-6 space-y-3">
              {chiSiamoPunti.map((p) => (
                <li key={p} className="flex gap-3">
                  <Check
                    size={20}
                    className="mt-1 shrink-0 text-orange"
                    aria-hidden
                  />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-teal p-8 text-cream">
            <p className="text-5xl font-bold">{DATO_ASSOCIAZIONI}</p>
            <p className="mt-2 font-semibold">
              {t("associazioniRappresentate")}
            </p>
            <p className="mt-1 text-sm text-cream/80">
              {t("associazioniSottotitolo")}
            </p>
          </div>
        </div>

        <SectionDivider className="my-14" />

        {/* Valori */}
        <section aria-labelledby="valori-heading">
          <h2
            id="valori-heading"
            className="text-[length:var(--text-h2)] font-bold text-ink"
          >
            {t("valoriTitolo")}
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {valori.map((v, i) => (
              <ValueCard key={v.titolo} valore={v} index={i} />
            ))}
          </div>
        </section>

        <SectionDivider accent="teal" className="my-14" />

        {/* Storia */}
        <section aria-labelledby="storia-heading">
          <h2
            id="storia-heading"
            className="text-[length:var(--text-h2)] font-bold text-ink"
          >
            {t("storiaTitolo")}
          </h2>
          <div className="mt-8 max-w-2xl">
            <StoriaTimeline momenti={storia} />
          </div>
        </section>

        {/* CTA */}
        <div className="mt-16 flex flex-col items-start gap-4 rounded-2xl border border-border bg-cream-50 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-ink">{t("ctaTitolo")}</p>
            <p className="mt-1 text-ink-soft">{t("ctaSottotitolo")}</p>
          </div>
          <Button href="/contatti">{tc("contattaci")}</Button>
        </div>
      </Container>
    </main>
  );
}
