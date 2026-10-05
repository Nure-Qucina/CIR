import Image from "next/image";
import type { MomentoStoria } from "@/lib/data/cir";
import { TAPPE_STORIA } from "@/lib/carta";
import { cn } from "@/lib/utils/cn";

/**
 * "La nostra storia" come sentiero: ogni momento ha la sua tappa illustrata
 * (germoglio → tavolo degli incontri → bandierine → arco della nascita) e il
 * testo su un foglietto di carta che si appoggia sull'illustrazione.
 * A zig-zag da desktop, in colonna su telefono. Markup semantico ol/li.
 */
export function StoriaSentiero({ momenti }: { momenti: MomentoStoria[] }) {
  return (
    <ol className="grid gap-6 md:gap-2">
      {momenti.map((m, i) => {
        const tappa = TAPPE_STORIA[i % TAPPE_STORIA.length];
        const pari = i % 2 === 1;
        return (
          <li key={i} className="grid items-center md:grid-cols-2 md:gap-12">
            <Image
              src={tappa.src}
              width={tappa.width}
              height={tappa.height}
              alt=""
              sizes="(max-width: 768px) 100vw, 540px"
              className={cn(
                "sfuma-bordi mx-auto h-auto w-full max-w-[540px]",
                pari && "md:order-2",
              )}
            />
            <div
              className={cn(
                "foglio relative mx-3 -mt-2 p-5 sm:p-6 md:mx-0 md:mt-0",
                pari ? "md:rotate-[0.8deg]" : "md:-rotate-[0.8deg]",
              )}
            >
              <p className="flex items-center gap-3">
                <span className="bg-teal text-cream grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold tracking-[0.16em] text-orange-700 uppercase">
                  {m.periodo}
                </span>
              </p>
              <p className="text-ink mt-3 leading-relaxed">{m.testo}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
