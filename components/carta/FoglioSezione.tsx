import { cn } from "@/lib/utils/cn";
import { Strappo } from "./Strappo";

/**
 * Sezione su un foglio colorato con i bordi strappati sopra e sotto.
 * `chiusura={false}` lascia il foglio aperto in basso (es. il footer).
 */
export function FoglioSezione({
  tono,
  children,
  className,
  chiusura = true,
  as: Tag = "section",
  ...rest
}: {
  tono: "teal" | "arancio";
  children: React.ReactNode;
  className?: string;
  chiusura?: boolean;
  as?: React.ElementType;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag {...rest}>
      <Strappo colore={tono} />
      <div
        className={cn(
          "relative",
          tono === "teal" ? "carta-teal" : "carta-arancio",
          className,
        )}
      >
        {children}
      </div>
      {chiusura && <Strappo colore={tono} verso="giu" />}
    </Tag>
  );
}
