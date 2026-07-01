"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * Link di navigazione con stato attivo (aria-current) basato sulla rotta.
 */
export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
        active
          ? "text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-orange"
          : "text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
