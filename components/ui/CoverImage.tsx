import Image from "next/image";
import { GeometricPattern } from "./GeometricPattern";
import { cn } from "@/lib/utils/cn";

/**
 * Immagine di copertina con fallback on-brand: finché il cliente non fornisce
 * le foto reali (⚠️ DA FORNIRE), mostriamo un blocco crema con motivo geometrico,
 * mai un'immagine finta o stock.
 */
export function CoverImage({
  src,
  alt,
  className,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center bg-cream-200 text-teal-300",
        className,
      )}
      role="img"
      aria-label={alt}
    >
      <div className="absolute inset-0 opacity-25">
        <GeometricPattern
          size={64}
          id={`ph-${alt.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "img"}`}
        />
      </div>
    </div>
  );
}
