import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * Icona ufficiale del CIR — mark "CIR" (nero + arco arancione), ritagliata dal
 * lockup fornito dal cliente (public/LogoCirNero.png) escludendo il wordmark
 * per restare leggibile alle dimensioni compatte dell'header.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
      aria-label="Comunità Islamica di Roma — home"
    >
      <Image
        src="/LogoCirNeroIcon.png"
        alt="Comunità Islamica di Roma"
        width={472}
        height={195}
        priority
        className="h-10 w-auto"
      />
    </Link>
  );
}
