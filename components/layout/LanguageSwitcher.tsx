"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils/cn";

const SHORT_LABEL: Record<string, string> = {
  it: "IT",
  en: "EN",
  ar: "AR",
  bn: "BN",
};

/**
 * Selettore lingua (IT · EN · العربية · বাংলা): mantiene la pagina corrente,
 * accessibile da tastiera, con `hrefLang` sui link. `compact` mostra solo il
 * codice lingua (per l'header desktop); esteso mostra il nome nativo (menu
 * mobile).
 */
export function LanguageSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("languageSwitcher");

  return (
    <nav aria-label={t("label")} className={className}>
      <ul className="flex flex-wrap items-center gap-1">
        {routing.locales.map((loc) => {
          const active = loc === locale;
          return (
            <li key={loc}>
              <Link
                href={pathname}
                locale={loc}
                hrefLang={loc}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "inline-flex items-center rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-teal text-white"
                    : "text-ink-soft hover:bg-cream-dark hover:text-ink",
                )}
              >
                {compact ? SHORT_LABEL[loc] : t(loc)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
