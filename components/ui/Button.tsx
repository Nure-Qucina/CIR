import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Button — rispetta le regole di contrasto WCAG AA del brand (§5.2):
 *  - primary:   sfondo arancione + testo INK (non bianco) → ~6.6:1
 *  - secondary: sfondo teal + testo bianco → ~5:1
 *  - ghost:     trasparente, bordo teal, testo ink
 *
 * Rende <Link> se passi `href`, altrimenti <button>.
 */

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-orange text-ink hover:bg-orange-dark focus-visible:outline-ink",
  secondary:
    "bg-teal text-white hover:bg-teal-dark focus-visible:outline-teal-dark",
  ghost:
    "bg-transparent text-ink ring-1 ring-inset ring-teal hover:bg-teal-50 focus-visible:outline-teal",
};

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-2 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3 text-base",
};

type StyleProps = { variant?: Variant; size?: Size };

type ButtonAsButton = StyleProps &
  ComponentProps<"button"> & { href?: undefined };

type ButtonAsLink = StyleProps &
  ComponentProps<typeof Link> & { href: string };

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: (ButtonAsButton | ButtonAsLink) & {
  className?: string;
  children: ReactNode;
}) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link className={classes} {...(rest as ComponentProps<typeof Link>)}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(rest as ComponentProps<"button">)}>
      {children}
    </button>
  );
}
