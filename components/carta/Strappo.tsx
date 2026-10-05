import { cn } from "@/lib/utils/cn";

/**
 * Bordo di carta strappata. È lo stesso fondo del foglio (`.carta-teal` /
 * `.carta-arancio`) ritagliato da una maschera SVG, con sotto uno strato di
 * fibre chiare che sporge di qualche px: colore e grana combaciano con la
 * sezione per costruzione. Maschere generate da scripts/genera-strappo.mjs.
 * `verso="su"` apre il foglio, `verso="giu"` lo chiude (stesso bordo capovolto).
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
        "relative h-9 w-full drop-shadow-[0_-1px_1.5px_rgb(42_31_14/0.16)] sm:h-14",
        verso === "giu" ? "-mt-px -scale-y-100" : "-mb-px",
        className,
      )}
    >
      <div className="strappo-fibre absolute inset-0" />
      <div
        className={cn(
          "strappo-foglio absolute inset-0",
          colore === "teal" ? "carta-teal" : "carta-arancio",
        )}
      />
    </div>
  );
}
