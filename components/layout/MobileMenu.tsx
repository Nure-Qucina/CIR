"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { DONATION_ROUTE } from "@/lib/donazioni/config";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SEZIONI_RETE } from "./ReteMenu";
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
  rete,
}: {
  nav: NavItem[];
  /** Mostra il gruppo «La rete» (interruttore in Keystatic). */
  rete: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("common");
  const tn = useTranslations("nav");
  const tr = useTranslations("rete.menu");
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
        className="text-ink hover:bg-cream-dark grid h-10 w-10 place-items-center rounded-lg"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Overlay + pannello — opaco (niente backdrop-filter) */}
      <div
        id="mobile-menu"
        hidden={!open}
        className={cn(
          "bg-cream fixed inset-x-0 top-16 bottom-0 z-50",
          "border-border flex flex-col gap-1 overflow-y-auto border-t p-6",
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
                <Fragment key={item.href}>
                  <li>
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
                  {rete && item.href === "/chi-siamo" && (
                    <li className="border-border my-2 border-y py-3">
                      <p className="px-4 pb-2 text-xs font-extrabold tracking-[0.16em] text-orange-700 uppercase">
                        {tn("laRete")}
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {SEZIONI_RETE.map((s) => {
                          const corrente = pathname.startsWith(s.href);
                          return (
                            <li key={s.href}>
                              <Link
                                href={s.href}
                                onClick={() => setOpen(false)}
                                aria-current={corrente ? "page" : undefined}
                                className={cn(
                                  "flex items-center gap-3.5 rounded-lg px-3 py-2",
                                  corrente
                                    ? "bg-cream-dark"
                                    : "bg-cream-50 hover:bg-cream-dark",
                                )}
                              >
                                <Image
                                  src={s.img.src}
                                  width={s.img.width}
                                  height={s.img.height}
                                  alt=""
                                  sizes="52px"
                                  className="h-11 w-12 shrink-0 object-contain"
                                />
                                <span className="flex flex-col">
                                  <span className="text-ink text-base font-bold">
                                    {tn(s.chiave)}
                                  </span>
                                  <span className="text-ink-soft text-sm">
                                    {tr(s.breve)}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ul>
        </nav>

        <LanguageSwitcher className="border-border mt-4 border-t pt-4" />

        <Link
          href={DONATION_ROUTE}
          onClick={() => setOpen(false)}
          className={buttonClassName({ className: "mt-4 w-full" })}
        >
          {t("dona")}
        </Link>
      </div>
    </div>
  );
}
