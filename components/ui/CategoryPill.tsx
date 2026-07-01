import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Pill categoria — tinta tenue on-brand, contrasto AA garantito.
 * Il colore arriva dalla categoria (`colore: "teal" | "orange"`, vedi §3.3).
 * Se passi `href` diventa un link filtrabile.
 */

type Color = "teal" | "orange";

const colorClasses: Record<Color, string> = {
  teal: "bg-teal-100 text-teal-800",
  orange: "bg-orange-100 text-orange-800",
};

type Props = {
  children: React.ReactNode;
  color?: Color;
  href?: string;
  className?: string;
};

export function CategoryPill({
  children,
  color = "teal",
  href,
  className,
}: Props) {
  const classes = cn(
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
    colorClasses[color],
    href && "transition-opacity hover:opacity-80",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return <span className={classes}>{children}</span>;
}
