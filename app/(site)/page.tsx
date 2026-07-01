import Link from "next/link";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { CoverImage } from "@/components/ui/CoverImage";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { HeroCentered } from "@/components/home/HeroCentered";
import { ValueCard } from "@/components/home/ValueCard";
import { StoriaTimeline } from "@/components/home/StoriaTimeline";
import { MediaBlock } from "@/components/home/MediaBlock";
import { DonateBanner } from "@/components/home/DonateBanner";
import { ArticleCard } from "@/components/news/ArticleCard";
import { getEventi } from "@/lib/content/eventi";
import { getArticoli } from "@/lib/content/articoli";
import { getCategorieMap } from "@/lib/content/categorie";
import { getSiteConfig } from "@/lib/content/site";
import { VALORI, STORIA } from "@/lib/data/cir";
import { formatDateIt, formatTimeIt, isoDate } from "@/lib/utils/date";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

export default async function Home() {
  const [eventi, articoliEvidenza, categorieMap, site] = await Promise.all([
    getEventi(),
    getArticoli({ inEvidenza: true }),
    getCategorieMap(),
    getSiteConfig(),
  ]);

  // Evento in evidenza: il prossimo futuro, altrimenti l'ultimo passato.
  const featured = eventi.find((e) => !e.isPast) ?? eventi[0] ?? null;
  const newsHome = articoliEvidenza.slice(0, 4);

  return (
    <main id="contenuto">
      {/* A) HERO */}
      <HeroCentered />

      {/* B) Valori */}
      <section aria-labelledby="valori-home" className="bg-cream-50">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
              Cosa ci muove
            </p>
            <h2
              id="valori-home"
              className="mt-3 text-[length:var(--text-h2)] font-bold text-balance text-ink"
            >
              I valori che ci tengono uniti
            </h2>
            <p className="mt-4 text-ink-soft">
              Veniamo da storie diverse, ma remiamo nella stessa direzione. Ecco
              i principi che guidano il nostro lavoro.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {VALORI.map((v, i) => (
              <ValueCard key={v.titolo} valore={v} index={i} />
            ))}
          </div>
        </Container>
      </section>

      {/* C) La nostra storia */}
      <section aria-labelledby="storia-home">
        <Container className="py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
                Da dove veniamo
              </p>
              <h2
                id="storia-home"
                className="mt-3 text-[length:var(--text-h2)] font-bold text-balance text-ink"
              >
                La nostra storia
              </h2>
              <p className="mt-4 text-ink-soft">
                Una rete nata dal basso, dall&apos;incontro tra giovani, famiglie
                e associazioni di Roma.
              </p>
              <Button href="/chi-siamo" variant="ghost" className="mt-6">
                Scopri chi siamo
                <ArrowRight size={16} aria-hidden />
              </Button>
            </div>
            <StoriaTimeline momenti={STORIA} />
          </div>
        </Container>
      </section>

      <SectionDivider accent="teal" />

      {/* D) Evento in evidenza */}
      {featured && (
        <section aria-labelledby="evento-home">
          <Container className="py-16 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
                  Vita della comunità
                </p>
                <h2
                  id="evento-home"
                  className="mt-3 text-[length:var(--text-h2)] font-bold text-ink"
                >
                  {featured.isPast ? "Ultimo evento" : "Prossimo evento"}
                </h2>
              </div>
              <Link
                href="/eventi"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline sm:inline-flex"
              >
                Tutti gli eventi
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>

            <Card
              as="article"
              className="mt-8 grid overflow-hidden md:grid-cols-2"
            >
              <Link
                href={`/eventi/${featured.slug}`}
                className="relative block aspect-[16/10] md:aspect-auto"
                aria-hidden="true"
                tabIndex={-1}
              >
                <CoverImage
                  src={featured.copertina}
                  alt={featured.titolo}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </Link>
              <div className="flex flex-col justify-center p-6 sm:p-8">
                <span
                  className={
                    "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold " +
                    (featured.isPast
                      ? "bg-teal-100 text-teal-800"
                      : "bg-orange-100 text-orange-800")
                  }
                >
                  {featured.isPast ? "Evento concluso" : "In programma"}
                </span>
                <h3 className="mt-3 text-2xl font-bold text-ink">
                  {featured.titolo}
                </h3>
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-ink-soft">
                  <span className="flex items-center gap-2">
                    <Calendar size={15} className="text-teal" aria-hidden />
                    <time dateTime={isoDate(featured.dataInizio)}>
                      {formatDateIt(featured.dataInizio)}
                      {!featured.tuttoIlGiorno &&
                        ` · ${formatTimeIt(featured.dataInizio)}`}
                    </time>
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin size={15} className="text-teal" aria-hidden />
                    {[featured.luogo.nome, featured.luogo.citta]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-ink-soft">
                  {featured.estratto}
                </p>
                <div className="mt-6">
                  <Button href={`/eventi/${featured.slug}`}>
                    Dettagli evento
                    <ArrowRight size={16} aria-hidden />
                  </Button>
                </div>
              </div>
            </Card>

            {featured.isPast && (
              <p className="mt-4 text-sm text-ink-soft">
                Nessun evento in programma al momento — seguici sui social per
                restare aggiornato sui prossimi appuntamenti.
              </p>
            )}
          </Container>
        </section>
      )}

      {/* E) News in evidenza */}
      {newsHome.length > 0 && (
        <section aria-labelledby="news-home" className="bg-cream-50">
          <Container className="py-16 sm:py-20">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
                  Voci della comunità
                </p>
                <h2
                  id="news-home"
                  className="mt-3 text-[length:var(--text-h2)] font-bold text-ink"
                >
                  Dalle nostre {site.labelNews}
                </h2>
              </div>
              <Link
                href="/news"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-teal-700 underline-offset-4 hover:underline sm:inline-flex"
              >
                Tutti gli articoli
                <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {newsHome.map((a) => (
                <ArticleCard
                  key={a.slug}
                  articolo={a}
                  categoria={categorieMap.get(a.categoria)}
                />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* F) Media e comunicazione */}
      <MediaBlock />

      {/* G) Sostieni il CIR */}
      <DonateBanner donazioniUrl={site.donazioniUrl} />
    </main>
  );
}
