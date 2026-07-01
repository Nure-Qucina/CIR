import type { MomentoStoria } from "@/lib/data/cir";

/**
 * Timeline verticale "La nostra storia": nodi sul percorso brand (teal/arancione).
 * Markup semantico (ol/li). Coerente con la timeline eventi.
 */
export function StoriaTimeline({ momenti }: { momenti: MomentoStoria[] }) {
  return (
    <ol className="relative ml-1">
      <span
        aria-hidden
        className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-gradient-to-b from-orange via-teal to-teal-300"
      />
      {momenti.map((m, i) => (
        <li key={i} className="relative pb-8 pl-8 last:pb-0">
          <span
            aria-hidden
            className="absolute top-1 left-0 h-3.5 w-3.5 rounded-full border-2 border-orange bg-cream"
          />
          <p className="text-sm font-semibold tracking-wide text-orange-700 uppercase">
            {m.periodo}
          </p>
          <p className="mt-1.5 leading-relaxed text-ink">{m.testo}</p>
        </li>
      ))}
    </ol>
  );
}
