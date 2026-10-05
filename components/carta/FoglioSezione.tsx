import { cn } from "@/lib/utils/cn";
import { Strappo } from "./Strappo";

/**
 * Sezione su un foglio colorato con i bordi strappati sopra e sotto.
 * `chiusura={false}` lascia il foglio aperto in basso (es. il footer).
 * `chiudeSu` fa chiudere lo strappo direttamente sul foglio successivo (niente
 * crema in mezzo): il foglio dopo va messo con `apertura={false}`.
 */
export function FoglioSezione({
  tono,
  children,
  className,
  chiusura = true,
  apertura = true,
  chiudeSu,
  as: Tag = "section",
  ...rest
}: {
  tono: "teal" | "arancio";
  children: React.ReactNode;
  className?: string;
  chiusura?: boolean;
  apertura?: boolean;
  chiudeSu?: "teal" | "arancio";
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag {...rest}>
      {apertura && <Strappo colore={tono} />}
      <div
        className={cn(
          "relative",
          tono === "teal" ? "carta-teal" : "carta-arancio",
          className,
        )}
      >
        {children}
      </div>
      {chiusura && <Strappo colore={tono} verso="giu" fondo={chiudeSu} />}
    </Tag>
  );
}
