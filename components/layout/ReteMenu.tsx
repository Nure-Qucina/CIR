"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { ILLUSTRAZIONI } from "@/lib/carta";
import { cn } from "@/lib/utils/cn";

/** Le tre sezioni de «La rete», in ordine: usate dal pannello e dal menu mobile. */
export const SEZIONI_RETE = [
  {
    href: "/moschee",
    chiave: "moschee",
    desc: "moscheeDesc",
    cta: "moscheeCta",
    breve: "moscheeBreve",
    img: ILLUSTRAZIONI.moschea,
  },
  {
    href: "/sponsor",
    chiave: "sponsor",
    desc: "sponsorDesc",
    cta: "sponsorCta",
    breve: "sponsorBreve",
    img: ILLUSTRAZIONI.bottega,
  },
  {
    href: "/professionisti",
    chiave: "professionisti",
    desc: "professionistiDesc",
    cta: "professionistiCta",
    breve: "professionistiBreve",
    img: ILLUSTRAZIONI.valigetta,
  },
] as const;

/**
 * Voce «La rete» del menu desktop: niente freccia (scelta di design), si
 * apre al passaggio del mouse o al click/tap e mostra un pannello largo
 * quanto l'header con le tre sezioni illustrate.
 * Accessibile: bottone con aria-expanded/aria-controls, Esc chiude e
 * riporta il focus, click fuori chiude, ogni link chiude il pannello.
 * Il pannello è `absolute` rispetto all'header (sticky = posizionato).
 */
export function ReteMenu() {
  const t = useTranslations("nav");
  const tr = useTranslations("rete.menu");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Aperto passandoci sopra col mouse: il primo clic non deve richiuderlo
  // (chi clicca «La rete» vuole vedere il pannello, non nasconderlo).
  const apertoDaHover = useRef(false);

  const attiva = SEZIONI_RETE.some((s) => pathname.startsWith(s.href));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const apri = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const chiudiPresto = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  };

  return (
    <div
      ref={wrapRef}
      onPointerEnter={(e) => {
        if (e.pointerType !== "mouse") return;
        if (!open) apertoDaHover.current = true;
        apri();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "mouse") return;
        apertoDaHover.current = false;
        chiudiPresto();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (apertoDaHover.current) {
            apertoDaHover.current = false;
            apri();
            return;
          }
          setOpen((v) => !v);
        }}
        className={cn(
          "relative rounded-full px-3 py-2 text-sm font-semibold transition-colors",
          open
            ? "bg-cream-dark text-orange-700"
            : attiva
              ? "text-ink after:bg-orange after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full"
              : "text-ink-soft hover:text-ink",
        )}
      >
        {t("laRete")}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="bg-cream-50 border-border absolute inset-x-0 top-full border-b shadow-[0_22px_40px_-24px_rgb(42_31_14/0.5)]"
      >
        <ul className="mx-auto grid max-w-6xl grid-cols-3 gap-6 px-4 py-8 sm:px-6">
          {SEZIONI_RETE.map((s) => {
            const corrente = pathname.startsWith(s.href);
            return (
              <li key={s.href}>
                <Link
                  href={s.href}
                  onClick={() => setOpen(false)}
                  aria-current={corrente ? "page" : undefined}
                  className={cn(
                    "group flex h-full flex-col gap-2.5 rounded-md p-5 transition-colors",
                    corrente ? "bg-cream" : "hover:bg-cream",
                  )}
                >
                  <span className="flex h-32 items-end">
                    <Image
                      src={s.img.src}
                      width={s.img.width}
                      height={s.img.height}
                      alt=""
                      sizes="140px"
                      className="h-28 w-auto"
                    />
                  </span>
                  <span className="text-ink text-xl font-extrabold">
                    {t(s.chiave)}
                  </span>
                  <span className="text-ink-soft text-sm leading-relaxed">
                    {tr(s.desc)}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 group-hover:underline group-hover:underline-offset-4">
                    {tr(s.cta)}
                    <ArrowRight
                      size={15}
                      className="rtl:rotate-180"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
