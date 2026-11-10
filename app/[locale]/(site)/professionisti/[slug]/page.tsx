import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowLeft,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { LangBadge } from "@/components/ui/LangBadge";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/jsonLd";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";
import { robotsRete } from "@/lib/content/site";
import { Monogramma } from "@/components/rete/Monogramma";
import { BarraAzioni } from "@/components/rete/BarraAzioni";
import { ProfessionistaCard } from "@/components/rete/ProfessionistaCard";
import {
  getProfessionisti,
  getProfessionistaBySlug,
  getProfessionistiSlugs,
  lingueProfessionista,
  telHref,
  whatsappHref,
} from "@/lib/content/rete";

/**
 * Una volta al giorno, non ogni ora: i contenuti arrivano col deploy, qui
 * cambia solo ciò che dipende dalla data (eventi passati, agevolazioni
 * scadute). Ogni rigenerazione è una ISR write anche a contenuto invariato.
 */
export const revalidate = 86400;

/** Solo gli slug noti alla build: un URL inventato dà 404 senza finire nella cache ISR. */
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getProfessionistiSlugs();
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
  const p = await getProfessionistaBySlug(slug, locale as Locale);
  if (!p) return { title: "Professionisti" };
  return {
    title: `${p.nome} · ${p.ruolo}`,
    description: p.perche || p.ruolo,
    alternates: buildAlternates(
      `/professionisti/${slug}`,
      locale as Locale,
      await lingueProfessionista(slug),
    ),
    openGraph: buildOgLocale(locale as Locale),
    robots: await robotsRete(),
  };
}

export default async function ProfessionistaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale as Locale);
  const [t, tc, tn, tl, p, tutti] = await Promise.all([
    getTranslations({
      locale: locale as Locale,
      namespace: "rete.professionisti",
    }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getTranslations({ locale: locale as Locale, namespace: "nav" }),
    getTranslations({ locale: locale as Locale, namespace: "rete.lingue" }),
    getProfessionistaBySlug(slug, locale as Locale),
    getProfessionisti(locale as Locale),
  ]);
  if (!p) notFound();

  const altri = tutti
    .filter((x) => x.slug !== p.slug && x.area === p.area)
    .slice(0, 2);
  const dove =
    p.inStudio && p.online
      ? t("inStudioEOnline")
      : p.online
        ? t("soloOnline")
        : p.zona || t("inStudio");
  const lingue = p.lingue.map((l) => tl(l)).join(", ");
  const validaFino = p.agevolazione?.validaFino
    ? new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(`${p.agevolazione.validaFino}T12:00:00`))
    : undefined;
  const crumbs = [
    { label: tc("home"), href: "/" },
    { label: tn("professionisti"), href: "/professionisti" },
    { label: p.nome },
  ];
  const c = p.contatti;

  return (
    <main id="contenuto" className="pb-32 md:pb-0">
      <JsonLd data={[breadcrumbJsonLd(crumbs, locale as Locale)]} />
      <Container className="flex flex-col gap-10 py-8 sm:py-12">
        <Breadcrumbs crumbs={crumbs} />

        <div className="flex flex-wrap items-start gap-x-12 gap-y-8">
          <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
              <Monogramma
                nome={p.nome}
                src={p.immagine}
                size={132}
                forma={p.tipo === "azienda" ? "quadrato" : "tondo"}
                className={
                  p.tipo === "persona"
                    ? "shadow-[0_0_0_4px_#fdfaf5,0_0_0_5px_#e7ddcf]"
                    : undefined
                }
              />
              <div className="flex min-w-0 flex-col items-center gap-2 sm:items-start">
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                  {t(`aree.${p.area}`)}
                </span>
                <h1 className="text-ink text-[length:var(--text-h2)] leading-tight font-extrabold">
                  {p.nome}
                </h1>
                <p className="text-ink-soft text-lg">
                  {p.ruolo} · {dove}
                </p>
                {p.albo && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-teal-700">
                    <ShieldCheck size={16} aria-hidden />
                    {p.albo}
                  </p>
                )}
              </div>
            </div>
            {p.isFallback && <LangBadge className="self-start" />}

            {lingue && (
              <p className="bg-cream-dark text-ink self-start rounded-full px-3.5 py-1.5 text-sm font-semibold">
                {t("lingue", { lingue })}
              </p>
            )}

            {p.perche && (
              <figure className="border-orange flex max-w-2xl flex-col gap-1.5 border-s-[3px] ps-5">
                <figcaption className="text-xs font-extrabold tracking-[0.16em] text-orange-700 uppercase">
                  {t("perche")}
                </figcaption>
                <blockquote className="text-ink font-serif text-xl leading-snug italic sm:text-[22px]">
                  {p.perche}
                </blockquote>
              </figure>
            )}

            {p.ambiti.length > 0 && (
              <section className="flex max-w-2xl flex-col gap-3">
                <h2 className="text-ink text-xl font-extrabold">
                  {t("diCosaSiOccupa")}
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {p.ambiti.map((a) => (
                    <li
                      key={a}
                      className="foglio text-ink flex items-center gap-3 px-4 py-3 text-[15px] leading-snug font-semibold"
                    >
                      <span
                        aria-hidden
                        className="bg-orange h-2 w-2 shrink-0 rotate-45 rounded-[1px]"
                      />
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {p.descrizione && (
              <section className="flex max-w-2xl flex-col gap-3">
                <h2 className="text-ink text-xl font-extrabold">
                  {p.ambiti.length > 0 ? t("chiE") : t("diCosaSiOccupa")}
                </h2>
                <div className="text-ink-soft flex flex-col gap-3 text-[17px] leading-relaxed">
                  {p.descrizione
                    .split(/\n\s*\n/)
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .map((par) => (
                      <p key={par}>{par}</p>
                    ))}
                </div>
              </section>
            )}
          </article>

          <aside className="flex w-full flex-[1_1_340px] flex-col gap-4">
            {p.agevolazione && (
              <div className="flex flex-col gap-2.5 rounded-md border-2 border-dashed border-orange-500 bg-orange-100 p-6">
                <p className="text-xs font-extrabold tracking-[0.16em] text-orange-700 uppercase">
                  {t("agevolazione")}
                </p>
                <p className="flex items-center gap-3">
                  <span className="text-ink text-5xl leading-none font-extrabold">
                    {p.agevolazione.breve}
                  </span>
                  <span className="text-ink text-base leading-snug font-semibold">
                    {p.agevolazione.suCosa}
                  </span>
                </p>
                {p.agevolazione.passi.length > 0 && (
                  <ol className="text-ink mt-1 flex list-decimal flex-col gap-1 ps-5 text-[15px] leading-snug">
                    {p.agevolazione.passi.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ol>
                )}
                {validaFino && (
                  <p className="text-sm text-orange-800">
                    {t("validaFino", { data: validaFino })}
                  </p>
                )}
              </div>
            )}

            {(c.telefono || c.whatsapp || c.email || c.sito || c.indirizzo) && (
              <div className="foglio flex flex-col gap-2.5 p-5">
                <h2 className="text-ink text-lg font-extrabold">
                  {t("contatta")}
                </h2>
                {c.telefono && (
                  <a
                    href={telHref(c.telefono)}
                    className="bg-orange text-ink hover:bg-orange-dark flex min-h-12 items-center justify-center gap-2 rounded-full text-[15px] font-bold"
                  >
                    <Phone size={17} aria-hidden />
                    {t("chiama")} {c.telefono}
                  </a>
                )}
                {c.whatsapp && (
                  <a
                    href={whatsappHref(c.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ring-teal flex min-h-12 items-center justify-center rounded-full text-[15px] font-bold text-teal-700 ring-[1.5px] ring-inset hover:bg-teal-50"
                  >
                    {t("whatsapp")}
                  </a>
                )}
                {c.email && (
                  <a
                    href={`mailto:${c.email}`}
                    className="ring-teal flex min-h-12 items-center justify-center gap-2 rounded-full text-[15px] font-bold text-teal-700 ring-[1.5px] ring-inset hover:bg-teal-50"
                  >
                    <Mail size={17} aria-hidden />
                    {c.email}
                  </a>
                )}
                {c.sito && (
                  <a
                    href={c.sito}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-teal-700 underline underline-offset-4"
                  >
                    <Globe size={16} aria-hidden />
                    {t("sito")}
                  </a>
                )}
                {c.indirizzo && (
                  <p className="text-ink-soft mt-1 flex gap-2 text-sm">
                    <MapPin
                      size={16}
                      className="text-teal mt-0.5 shrink-0"
                      aria-hidden
                    />
                    {t("studio")}: {c.indirizzo}
                  </p>
                )}
              </div>
            )}
          </aside>
        </div>

        <p className="text-ink-soft border-orange max-w-3xl border-s-[3px] ps-4 font-serif text-[15px] italic">
          {t("disclaimer")}
        </p>

        {altri.length > 0 && (
          <section className="border-border flex flex-col gap-4 border-t pt-8">
            <h2 className="text-ink text-xl font-extrabold">
              {t("altriArea", { area: t(`aree.${p.area}`) })}
            </h2>
            <ul className="grid gap-6 lg:grid-cols-2">
              {altri.map((a) => (
                <li key={a.slug}>
                  <ProfessionistaCard p={a} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href="/professionisti"
          className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
        >
          <ArrowLeft size={15} className="rtl:rotate-180" aria-hidden />
          {t("tutti_link")}
        </Link>
      </Container>

      <BarraAzioni
        nota={
          p.agevolazione
            ? `${p.agevolazione.breve} · ${t("diCheVieni")}`
            : undefined
        }
        azioni={[
          c.telefono && {
            href: telHref(c.telefono),
            label: t("chiama"),
            primario: true,
          },
          c.whatsapp && {
            href: whatsappHref(c.whatsapp),
            label: t("whatsapp"),
            esterno: true,
          },
          !c.whatsapp &&
            c.email && { href: `mailto:${c.email}`, label: t("email") },
        ]}
      />
    </main>
  );
}
