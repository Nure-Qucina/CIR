import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * Button — rispetta le regole di contrasto WCAG AA del brand (§5.2):
 *  - primary:   sfondo arancione + testo INK (non bianco) → ~6.6:1
 *  - secondary: sfondo teal + testo bianco → ~5:1
 *  - ghost:     trasparente, bordo teal, testo ink
 *
 * Rende <Link> locale-aware se passi un `href` interno, un `<a>` nativo per
 * URL esterni (LaunchGood, mailto, ecc. — non vanno prefissati di lingua),
 * altrimenti <button>.
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
  ComponentProps<"a"> & { href: string };

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

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
    const { href, ...anchorRest } = rest as ComponentProps<"a"> & {
      href: string;
    };
    if (isExternalHref(href)) {
      return (
        <a href={href} className={classes} {...anchorRest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchorRest}>
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
