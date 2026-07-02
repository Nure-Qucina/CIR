"use client";

import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/cn";

export type Crumb = { label: string; href?: string };

/** Breadcrumb accessibili (nav + ol). L'ultimo elemento è la pagina corrente. */
export function Breadcrumbs({
  crumbs,
  className,
}: {
  crumbs: Crumb[];
  className?: string;
}) {
  const t = useTranslations("a11y");
  return (
    <nav aria-label={t("percorso")} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {c.href && !last ? (
                <Link
                  href={c.href}
                  className="underline-offset-4 hover:text-ink hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={cn(last && "font-medium text-ink")}
                  aria-current={last ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
              {!last && (
                <ChevronRight
                  size={14}
                  className="text-ink-200 rtl:rotate-180"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
