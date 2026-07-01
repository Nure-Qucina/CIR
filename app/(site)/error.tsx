"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

// Boundary errori (500) per le rotte del sito. On-brand, con possibilità di retry.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In produzione qui si potrebbe loggare verso un servizio di monitoring.
    console.error(error);
  }, [error]);

  return (
    <main id="contenuto" className="flex flex-1 items-center">
      <Container className="py-24 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
          Errore
        </p>
        <h1 className="mt-3 text-[length:var(--text-h1)] font-bold text-ink">
          Qualcosa è andato storto
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
          Si è verificato un problema imprevisto. Puoi riprovare o tornare alla
          home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-xl bg-orange px-6 py-3 font-semibold text-ink transition-colors hover:bg-orange-dark"
          >
            Riprova
          </button>
          <Button href="/" variant="ghost">
            Torna alla home
          </Button>
        </div>
      </Container>
    </main>
  );
}
