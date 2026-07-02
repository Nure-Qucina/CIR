"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/utils/cn";

type NavItem = { label: string; href: string };

/**
 * Menu mobile a comparsa, accessibile da tastiera:
 *  - trigger con aria-expanded/aria-controls
 *  - chiusura con Esc, click su link, o cambio rotta
 *  - focus trappola leggera (chiude on Escape) e blocco scroll body
 */
export function MobileMenu({
  nav,
  donazioniUrl,
}: {
  nav: NavItem[];
  donazioniUrl: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("common");
  // Il menu si chiude al click sui link (vedi onClick sotto): nessun effetto
  // che chiama setState alla navigazione.

  // Esc per chiudere + blocco scroll quando aperto
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t("chiudiMenu") : t("apriMenu")}
        className="grid h-10 w-10 place-items-center rounded-lg text-ink hover:bg-cream-dark"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay + pannello — opaco (niente backdrop-filter) */}
      <div
        id="mobile-menu"
        hidden={!open}
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-50 bg-cream",
          "flex flex-col gap-1 overflow-y-auto border-t border-border p-6",
        )}
      >
        <nav aria-label={t("navigazionePrincipale")}>
          <ul className="flex flex-col gap-1">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-4 py-3 text-lg font-semibold",
                      active
                        ? "bg-cream-dark text-ink"
                        : "text-ink-soft hover:bg-cream-dark hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <LanguageSwitcher className="mt-4 border-t border-border pt-4" />

        <Button
          href={donazioniUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full"
        >
          {t("dona")}
        </Button>
      </div>
    </div>
  );
}
