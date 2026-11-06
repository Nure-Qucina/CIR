import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Clock, Globe, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CoverImage } from "@/components/ui/CoverImage";
import { LangBadge } from "@/components/ui/LangBadge";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";
import { robotsRete } from "@/lib/content/site";
import { Monogramma } from "@/components/rete/Monogramma";
import { BarraAzioni } from "@/components/rete/BarraAzioni";
import {
  getSponsor,
  getSponsorBySlug,
  getSponsorSlugs,
  lingueSponsor,
  mapsUrl,
  telHref,
} from "@/lib/content/rete";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getSponsorSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await getSponsorBySlug(slug, locale as Locale);
  if (!s) return { title: "Sponsor" };
  return {
    title: s.nome,
    description: s.fiducia || s.tipo,
    alternates: buildAlternates(
      `/sponsor/${slug}`,
      locale as Locale,
      await lingueSponsor(slug),
    ),
    openGraph: buildOgLocale(locale as Locale),
    robots: await robotsRete(),
  };
}

export default async function SponsorSchedaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const [t, tc, tn, s, tutti] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "rete.sponsor" }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getTranslations({ locale: locale as Locale, namespace: "nav" }),
    getSponsorBySlug(slug, locale as Locale),
    getSponsor(locale as Locale),
  ]);
  if (!s) notFound();

  const altri = tutti.filter((x) => x.slug !== s.slug).slice(0, 3);
  const indicazioni = s.indirizzo
    ? mapsUrl({ nome: s.nome, indirizzo: s.indirizzo })
    : undefined;
  const crumbs = [
    { label: tc("home"), href: "/" },
    { label: tn("sponsor"), href: "/sponsor" },
    { label: s.nome },
  ];
  const social = [
    s.contatti.sito && { href: s.contatti.sito, label: t("sito") },
    s.contatti.instagram && { href: s.contatti.instagram, label: "Instagram" },
    s.contatti.facebook && { href: s.contatti.facebook, label: "Facebook" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <main id="contenuto" className="pb-24 md:pb-0">
      <JsonLd data={[breadcrumbJsonLd(crumbs, locale as Locale)]} />
      <Container className="flex flex-col gap-8 py-8 sm:py-12">
        <Breadcrumbs crumbs={crumbs} />

        {/* Foto: sul telefono si sfogliano col dito, su computer una grande + due piccole */}
        {s.foto.length > 0 ? (
          <div className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:grid sm:[height:420px] sm:grid-cols-3 sm:grid-rows-2 sm:overflow-visible sm:px-0">
            {s.foto.slice(0, 3).map((src, i) => (
              <div
                key={src}
                className={
                  "relative aspect-[4/3] w-[85%] shrink-0 snap-center overflow-hidden rounded-md sm:aspect-auto sm:w-auto " +
                  (i === 0 ? "sm:col-span-2 sm:row-span-2" : "")
                }
              >
                <Image
                  src={src}
                  alt={t("foto", {
                    n: i + 1,
                    totale: Math.min(s.foto.length, 3),
                  })}
                  fill
                  priority={i === 0}
                  sizes={
                    i === 0
                      ? "(max-width: 640px) 85vw, 66vw"
                      : "(max-width: 640px) 85vw, 33vw"
                  }
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative aspect-[21/9] overflow-hidden rounded-md">
            <CoverImage src={null} alt={t("fotoDi", { nome: s.nome })} />
          </div>
        )}

        <div className="flex flex-wrap items-start gap-x-12 gap-y-8">
          <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <div className="flex items-center gap-4">
              <Monogramma nome={s.nome} src={s.logo} size={64} />
              <div className="flex flex-col gap-1.5">
                <span className="self-start rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-800">
                  {s.tipo}
                </span>
                <h1 className="text-ink text-[length:var(--text-h2)] leading-tight font-extrabold">
                  {s.nome}
                </h1>
              </div>
            </div>
            {s.isFallback && <LangBadge className="self-start" />}

            {s.fiducia && (
              <div className="bg-cream-50 flex flex-col gap-1.5 rounded-md px-6 py-5">
                <p className="text-xs font-bold tracking-[0.16em] text-orange-700 uppercase">
                  {t("perche")}
                </p>
                <p className="font-serif text-xl leading-snug italic">
                  {s.fiducia}
                </p>
              </div>
            )}

            {s.descrizione && (
              <div className="text-ink max-w-2xl font-serif text-lg leading-relaxed whitespace-pre-line">
                {s.descrizione}
              </div>
            )}
          </article>

          <aside className="flex flex-[1_1_320px] flex-col gap-4">
            <div className="foglio flex flex-col gap-4 p-6 text-[15px]">
              <h2 className="text-ink text-lg font-extrabold">
                {t("informazioni")}
              </h2>
              {(s.indirizzo || s.quartiere) && (
                <p className="flex gap-2.5">
                  <MapPin
                    size={18}
                    className="text-teal mt-0.5 shrink-0"
                    aria-hidden
                  />
                  {[s.indirizzo, s.quartiere].filter(Boolean).join(" · ")}
                </p>
              )}
              {s.orari && (
                <p className="flex gap-2.5 whitespace-pre-line">
                  <Clock
                    size={18}
                    className="text-teal mt-0.5 shrink-0"
                    aria-hidden
                  />
                  {s.orari}
                </p>
              )}
              {s.contatti.telefono && (
                <p className="flex gap-2.5">
                  <Phone
                    size={18}
                    className="text-teal mt-0.5 shrink-0"
                    aria-hidden
                  />
                  <a
                    href={telHref(s.contatti.telefono)}
                    className="underline-offset-4 hover:underline"
                  >
                    {s.contatti.telefono}
                  </a>
                </p>
              )}
              {social.length > 0 && (
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <Globe size={18} className="text-teal shrink-0" aria-hidden />
                  {social.map((x, i) => (
                    <span key={x.href}>
                      <a
                        href={x.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-4"
                      >
                        {x.label}
                      </a>
                      {i < social.length - 1 && " ·"}
                    </span>
                  ))}
                </p>
              )}
              <div className="hidden flex-wrap gap-2 md:flex">
                {indicazioni && (
                  <a
                    href={indicazioni}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-orange text-ink hover:bg-orange-dark flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-bold"
                  >
                    {t("indicazioni")}
                  </a>
                )}
                {s.contatti.telefono && (
                  <a
                    href={telHref(s.contatti.telefono)}
                    className="ring-teal flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-bold text-teal-700 ring-[1.5px] ring-inset hover:bg-teal-50"
                  >
                    {t("chiama")}
                  </a>
                )}
              </div>
            </div>
            {s.vantaggio && (
              <div className="bg-teal text-cream flex flex-col gap-1 rounded-md px-6 py-5">
                <p className="text-xs font-bold tracking-[0.16em] uppercase">
                  {t("perLaComunita")}
                </p>
                <p className="text-lg font-extrabold text-white">
                  {s.vantaggio}
                </p>
              </div>
            )}
          </aside>
        </div>

        {altri.length > 0 && (
          <section className="border-border flex flex-col gap-4 border-t pt-8">
            <h2 className="text-ink text-xl font-extrabold">{t("altri")}</h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {altri.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/sponsor/${a.slug}`}
                    className="foglio hover:bg-cream flex items-center gap-3 p-4"
                  >
                    <Monogramma nome={a.nome} src={a.logo} size={46} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-ink font-bold">{a.nome}</span>
                      <span className="text-ink-soft text-sm">{a.tipo}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href="/sponsor"
          className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" aria-hidden />
          {t("tutti_link")}
        </Link>
      </Container>

      <BarraAzioni
        azioni={[
          indicazioni && {
            href: indicazioni,
            label: t("indicazioni"),
            esterno: true,
            primario: true,
          },
          s.contatti.telefono && {
            href: telHref(s.contatti.telefono),
            label: t("chiama"),
          },
        ]}
      />
    </main>
  );
}
