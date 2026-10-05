import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Bordo di carta strappata (illustrazione generata, non disegnata in CSS).
 * `verso="su"` apre un foglio colorato, `verso="giu"` lo chiude: è la stessa
 * striscia capovolta. Il corpo della striscia ha il colore di `.carta-teal` /
 * `.carta-arancio`, quindi va messo a contatto con quel foglio.
 */
export function Strappo({
  colore,
  verso = "su",
  className,
}: {
  colore: "teal" | "arancio";
  verso?: "su" | "giu";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        // Su telefono l'altezza minima ingrandisce lo strappo (object-cover
        // ritaglia in larghezza), così i denti restano visibili.
        "relative h-[max(30px,4.8vw)] max-h-[76px] w-full overflow-hidden",
        verso === "giu" ? "-mt-px -scale-y-100" : "-mb-px",
        className,
      )}
    >
      <Image
        src={`/images/carta/strappo-${colore}.webp`}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-left-top"
      />
    </div>
  );
}
