import { cn } from "@/lib/utils/cn";

/**
 * Card — foglio di carta (redesign "Il foglio"): crema chiaro, angoli appena
 * arrotondati, ombra morbida, niente bordo. Building block per
 * EventCard/ArticleCard; la superficie è la classe `.foglio` di globals.css.
 */
export function Card({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return <Tag className={cn("foglio", className)}>{children}</Tag>;
}
