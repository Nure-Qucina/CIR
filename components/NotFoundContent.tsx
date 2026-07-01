import { Container } from "@/components/ui/Container";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { Button } from "@/components/ui/Button";

/** Contenuto 404 on-brand, condiviso tra il boundary di gruppo e quello globale. */
export function NotFoundContent() {
  return (
    <main
      id="contenuto"
      className="relative flex flex-1 items-center overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 text-teal opacity-[0.05]">
        <GeometricPattern size={90} id="nf-girih" />
      </div>
      <Container className="relative py-24 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
          Errore 404
        </p>
        <h1 className="mt-3 text-[length:var(--text-h1)] font-bold text-ink">
          Pagina non trovata
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
          La pagina che cerchi non esiste o è stata spostata. Torna alla home o
          esplora le sezioni del sito.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Torna alla home</Button>
          <Button href="/news" variant="ghost">
            Vai alle news
          </Button>
        </div>
      </Container>
    </main>
  );
}
