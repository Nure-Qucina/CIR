import { Container } from "@/components/ui/Container";
import Image from "next/image";
import { ILLUSTRAZIONI } from "@/lib/carta";
import { Button } from "@/components/ui/Button";

/** Contenuto 404 on-brand, condiviso tra il boundary di gruppo e quello globale. */
export function NotFoundContent() {
  return (
    <main
      id="contenuto"
      className="relative flex flex-1 items-center overflow-hidden"
    >
      <Container className="relative py-20 text-center">
        {/* La mappa di Roma con lo spillo: "ti sei perso?" */}
        <Image
          src={ILLUSTRAZIONI.mappa.src}
          width={ILLUSTRAZIONI.mappa.width}
          height={ILLUSTRAZIONI.mappa.height}
          alt=""
          sizes="320px"
          className="ritaglio mx-auto mb-8 h-auto w-64 -rotate-[3deg] sm:w-80"
        />
        <p className="text-orange text-sm font-semibold tracking-[0.2em] uppercase">
          Errore 404
        </p>
        <h1 className="text-ink mt-3 text-[length:var(--text-h1)] font-bold">
          Pagina non trovata
        </h1>
        <p className="text-ink-soft mx-auto mt-4 max-w-md text-lg">
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
