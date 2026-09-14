import { cn } from "@/lib/utils/cn";
import { Container } from "./Container";
import { GeometricPattern } from "./GeometricPattern";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

/**
 * Intestazione di pagina interna: occhiello + titolo + sottotitolo, su fondo
 * crema con watermark geometrico. Breadcrumb opzionali.
 * `compact` riduce solo lo spazio verticale (usato nelle pagine donazioni).
 */
export function PageHeader({
  occhiello,
  titolo,
  sottotitolo,
  crumbs,
  compact = false,
}: {
  occhiello?: string;
  titolo: string;
  sottotitolo?: string;
  crumbs?: Crumb[];
  compact?: boolean;
}) {
  return (
    <header className="border-border bg-cream-50 relative overflow-hidden border-b">
      <div className="text-teal pointer-events-none absolute inset-0 opacity-[0.05]">
        <GeometricPattern size={84} id="page-header-girih" />
      </div>
      <Container
        className={cn("relative", compact ? "py-6 sm:py-8" : "py-12 sm:py-16")}
      >
        {crumbs && crumbs.length > 0 && (
          <Breadcrumbs crumbs={crumbs} className={compact ? "mb-3" : "mb-4"} />
        )}
        {occhiello && (
          <p className="text-orange text-sm font-semibold tracking-[0.2em] uppercase">
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
      </Container>
    </header>
  );
}
