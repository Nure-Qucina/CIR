"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EventoView } from "@/lib/content/eventi";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { EventCard } from "./EventCard";
import { formatMonthYearIt, monthKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";

type Filtro = "prossimi" | "passati" | "tutti";

const FILTRI: { value: Filtro; label: string }[] = [
  { value: "prossimi", label: "Prossimi" },
  { value: "passati", label: "Passati" },
  { value: "tutti", label: "Tutti" },
];

export function EventTimeline({ eventi }: { eventi: EventoView[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const filtro: Filtro =
    (params.get("filtro") as Filtro) &&
    FILTRI.some((f) => f.value === params.get("filtro"))
      ? (params.get("filtro") as Filtro)
      : "tutti";

  const visibili = useMemo(() => {
    if (filtro === "prossimi") return eventi.filter((e) => !e.isPast);
    if (filtro === "passati") return eventi.filter((e) => e.isPast);
    return eventi;
  }, [eventi, filtro]);

  function setFiltro(f: Filtro) {
    const sp = new URLSearchParams(params.toString());
    if (f === "tutti") sp.delete("filtro");
    else sp.set("filtro", f);
    const qs = sp.toString();
    router.replace(qs ? `/eventi?${qs}` : "/eventi", { scroll: false });
  }

  return (
    <div>
      {/* Filtri chip — stato in URL per condivisibilità */}
      <div
        className="mb-10 flex flex-wrap gap-2"
        role="group"
        aria-label="Filtra eventi"
      >
        {FILTRI.map((f) => {
          const active = f.value === filtro;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltro(f.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-teal text-white"
                  : "bg-cream-200 text-ink-soft hover:bg-cream-300 hover:text-ink",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {visibili.length === 0 ? <EmptyState /> : <Timeline eventi={visibili} />}
    </div>
  );
}

function Timeline({ eventi }: { eventi: EventoView[] }) {
  const containerRef = useRef<HTMLOListElement>(null);
  const [fill, setFill] = useState(0);

  // Rivelazione progressiva delle card (IntersectionObserver) + riempimento
  // della linea in base allo scroll. `prefers-reduced-motion` è gestito via CSS
  // (i nodi restano visibili, le transizioni sono azzerate in globals.css).
  useEffect(() => {
    const items = Array.from(
      containerRef.current?.querySelectorAll("[data-node]") ?? [],
    );
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.15 },
    );
    items.forEach((el) => io.observe(el));

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = rect.height;
        const progressed = Math.min(Math.max(vh * 0.5 - rect.top, 0), total);
        setFill(total > 0 ? (progressed / total) * 100 : 0);
      });
    };
    // Calcolo iniziale in rAF (no setState sincrono nel corpo dell'effetto).
    const raf0 = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf0);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [eventi.length]);

  // Precalcola dove iniziano i nuovi mesi (etichette sticky), senza mutare
  // variabili durante il render.
  const conMese = eventi.map((evento, i) => ({
    evento,
    showMonth:
      i === 0 ||
      monthKey(evento.dataInizio) !== monthKey(eventi[i - 1].dataInizio),
  }));

  return (
    <ol ref={containerRef} className="relative ml-1 sm:ml-0">
      {/* Linea guida + riempimento */}
      <span
        aria-hidden
        className="absolute top-0 bottom-0 left-[7px] w-0.5 bg-border sm:left-[calc(11rem+7px)]"
      />
      <span
        aria-hidden
        className="absolute left-[7px] w-0.5 bg-orange transition-[height] duration-300 ease-out sm:left-[calc(11rem+7px)]"
        style={{ top: 0, height: `${fill}%` }}
      />

      {conMese.map(({ evento, showMonth }) => {
        return (
          <li key={evento.slug} data-node className="timeline-node relative">
            {/* Etichetta mese sticky (desktop a sinistra, mobile sopra) */}
            {showMonth && (
              <div className="sticky top-20 z-10 mb-3 sm:absolute sm:top-2 sm:left-0 sm:mb-0 sm:w-44 sm:pr-8 sm:text-right">
                <span className="inline-block rounded-full bg-cream-200 px-3 py-1 text-xs font-semibold text-ink-soft sm:bg-transparent sm:px-0">
                  {formatMonthYearIt(evento.dataInizio)}
                </span>
              </div>
            )}
            <div className="relative pb-10 pl-8 sm:pl-[calc(11rem+2.5rem)]">
              {/* Nodo sul percorso */}
              <span
                aria-hidden
                className="absolute top-1.5 left-[2px] h-3.5 w-3.5 rounded-full border-2 border-orange bg-cream sm:left-[calc(11rem+2px)]"
              />
              <EventCard evento={evento} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-cream-50 p-10 text-center">
      <p className="text-lg font-semibold text-ink">
        Nessun evento in programma al momento
      </p>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        Seguici su Instagram per restare aggiornato sui prossimi appuntamenti
        della comunità.
      </p>
      <a
        href="https://www.instagram.com/comunita_islamica_roma/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-orange-dark"
      >
        <InstagramIcon size={16} />
        Seguici su Instagram
      </a>
    </div>
  );
}
