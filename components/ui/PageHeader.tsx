import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { ILLUSTRAZIONI, type NomeIllustrazione } from "@/lib/carta";
import { Container } from "./Container";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

/**
 * Intestazione di pagina interna: occhiello + titolo + sottotitolo su crema,
 * con un ritaglio di carta a fianco (es. la busta in Contatti, il calendario
 * in Eventi). Breadcrumb opzionali.
 * `compact` riduce solo lo spazio verticale (usato nelle pagine donazioni).
 */
export function PageHeader({
  occhiello,
  titolo,
  sottotitolo,
  crumbs,
  compact = false,
  illustrazione,
}: {
  occhiello?: string;
  titolo: string;
  sottotitolo?: string;
  crumbs?: Crumb[];
  compact?: boolean;
  illustrazione?: NomeIllustrazione;
}) {
  const img = illustrazione ? ILLUSTRAZIONI[illustrazione] : null;
  return (
    <header className="bg-cream relative overflow-hidden">
      <Container
        className={cn(
          "relative grid items-center gap-x-6 sm:gap-x-10",
          img && "grid-cols-[1fr_auto]",
          compact ? "py-6 sm:py-10" : "py-10 sm:py-16",
        )}
      >
        <div className="min-w-0">
          {crumbs && crumbs.length > 0 && (
            <Breadcrumbs
              crumbs={crumbs}
              className={compact ? "mb-3" : "mb-4"}
            />
          )}
          {occhiello && (
            <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
              {occhiello}
            </p>
          )}
          <h1
            className={cn(
              "text-ink mt-2 max-w-3xl leading-tight font-bold text-balance",
              compact
                ? "text-[length:var(--text-h2)]"
                : "text-[length:var(--text-h1)]",
            )}
          >
            {titolo}
          </h1>
          {sottotitolo && (
            <p
              className={cn(
                "text-ink-soft max-w-2xl leading-relaxed",
                compact ? "mt-2 text-base" : "mt-4 text-lg",
              )}
            >
              {sottotitolo}
            </p>
          )}
        </div>
        {img && (
          <Image
            src={img.src}
            width={img.width}
            height={img.height}
            alt=""
            priority
            sizes="(max-width: 640px) 96px, 280px"
            className={cn(
              "ritaglio h-auto rotate-[3deg] self-start sm:self-center",
              // Larghezza secondo la forma: le illustrazioni larghe più ampie,
              // quelle alte più strette, così l'ingombro visivo è simile.
              img.width > img.height * 1.4
                ? "w-24 sm:w-56 lg:w-72"
                : img.width > img.height
                  ? "w-24 sm:w-48 lg:w-60"
                  : "w-20 sm:w-36 lg:w-44",
              compact && "sm:w-32 lg:w-36",
            )}
          />
        )}
      </Container>
    </header>
  );
}
