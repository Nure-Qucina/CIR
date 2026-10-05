import Image from "next/image";
import type { Valore } from "@/lib/data/cir";
import { ARCATE_VALORI } from "@/lib/carta";

/**
 * I valori come quattro arcate di carta, ognuna con la sua scenetta
 * (lanterna, treccia, tavola sulla soglia, fumetti sul ponte).
 * Su telefono: arcata stretta a fianco del testo; da desktop: quattro colonne.
 * Pensata per stare su un foglio teal (testo crema).
 */
export function ValoriArcate({ valori }: { valori: Valore[] }) {
  return (
    <ul className="grid gap-8 lg:grid-cols-4 lg:gap-7">
      {valori.map((v) => {
        const arco = ARCATE_VALORI[v.icona];
        return (
          <li
            key={v.titolo}
            className="grid grid-cols-[104px_1fr] items-start gap-5 lg:grid-cols-1 lg:text-center"
          >
            <Image
              src={arco.src}
              width={arco.width}
              height={arco.height}
              alt=""
              sizes="(max-width: 1024px) 104px, 260px"
              className="h-auto w-full rounded-t-full rounded-b-md shadow-[0_14px_30px_rgb(20_30_28/0.35)] transition-transform duration-500 lg:hover:-translate-y-1.5"
            />
            <div>
              <h3 className="mt-1 text-lg leading-snug font-bold lg:mt-3">
                {v.titolo}
              </h3>
              <p className="text-cream/85 mt-2 text-[0.95rem] leading-relaxed">
                {v.testo}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
