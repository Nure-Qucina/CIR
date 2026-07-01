import { Container } from "./Container";
import { GeometricPattern } from "./GeometricPattern";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

/**
 * Intestazione di pagina interna: occhiello + titolo + sottotitolo, su fondo
 * crema con watermark geometrico. Breadcrumb opzionali.
 */
export function PageHeader({
  occhiello,
  titolo,
  sottotitolo,
  crumbs,
}: {
  occhiello?: string;
  titolo: string;
  sottotitolo?: string;
  crumbs?: Crumb[];
}) {
  return (
    <header className="relative overflow-hidden border-b border-border bg-cream-50">
      <div className="pointer-events-none absolute inset-0 text-teal opacity-[0.05]">
        <GeometricPattern size={84} id="page-header-girih" />
      </div>
      <Container className="relative py-12 sm:py-16">
        {crumbs && crumbs.length > 0 && (
          <Breadcrumbs crumbs={crumbs} className="mb-4" />
        )}
        {occhiello && (
          <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
            {occhiello}
          </p>
        )}
        <h1 className="mt-2 max-w-3xl text-[length:var(--text-h1)] leading-tight font-bold text-balance text-ink">
          {titolo}
        </h1>
        {sottotitolo && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
            {sottotitolo}
          </p>
        )}
      </Container>
    </header>
  );
}
