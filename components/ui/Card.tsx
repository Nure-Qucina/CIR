import { cn } from "@/lib/utils/cn";

/**
 * Card — superficie base "warm minimal": bianco su crema, bordo tenue,
 * raggio morbido, ombra leggera. Building block per EventCard/ArticleCard.
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
  return (
    <Tag
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
