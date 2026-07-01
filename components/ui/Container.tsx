import { cn } from "@/lib/utils/cn";

/** Contenitore centrato con max-width e padding orizzontale coerenti. */
export function Container({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)}>
      {children}
    </Tag>
  );
}
