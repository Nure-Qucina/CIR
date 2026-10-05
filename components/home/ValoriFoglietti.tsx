import Image from "next/image";
import type { Valore } from "@/lib/data/cir";
import { OGGETTI_VALORI } from "@/lib/carta";
import { cn } from "@/lib/utils/cn";

/**
 * I valori come foglietti di carta crema su foglio teal, ognuno con il suo
 * oggetto ritagliato che esce dal bordo superiore (lanterna, treccia,
 * datteri e pane, fumetto). Leggermente inclinati a coppie alterne.
 * Una colonna su telefono, due su tablet, quattro da desktop.
 */
export function ValoriFoglietti({ valori }: { valori: Valore[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-16 pt-10 sm:grid-cols-2 lg:grid-cols-4">
      {valori.map((v, i) => {
        const ogg = OGGETTI_VALORI[v.icona];
        return (
          <li
            key={v.titolo}
            className={cn(
              "foglio text-ink relative px-5 pt-20 pb-5 sm:px-6 lg:pt-24",
              i % 2 === 0 ? "-rotate-[1.2deg]" : "rotate-[1deg]",
            )}
          >
            <Image
              src={ogg.img.src}
              width={ogg.img.width}
              height={ogg.img.height}
              alt=""
              sizes="160px"
              className="ritaglio absolute start-5 h-auto w-auto"
              style={{ height: ogg.altezza, top: `-${ogg.sporge}px` }}
            />
            <h3 className="text-lg leading-snug font-bold">{v.titolo}</h3>
            <p className="text-ink-soft mt-2 text-[0.95rem] leading-relaxed">
              {v.breve ?? v.testo}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
