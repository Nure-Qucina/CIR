"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link2, Check } from "lucide-react";
import { FacebookIcon } from "@/components/ui/SocialIcons";

/**
 * Pulsanti di condivisione: Facebook, WhatsApp e copia link.
 * L'URL è costruito da NEXT_PUBLIC_SITE_URL + pathname (usePathname "grezzo"
 * di next/navigation, NON quello locale-aware di next-intl: qui serve il
 * percorso completo con prefisso lingua, non quello ripulito) → stabile tra
 * server e client (niente hydration mismatch) e funzionante anche senza
 * JavaScript.
 */
export function ShareButtons({ titolo }: { titolo: string }) {
  const pathname = usePathname();
  const t = useTranslations("news");
  const [copied, setCopied] = useState(false);

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const url = `${base}${pathname}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${titolo} ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard non disponibile */
    }
  }

  const btn =
    "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-cream-200 text-ink transition-colors hover:bg-cream-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal";

  return (
    <div className="flex items-center gap-2">
      <span className="me-1 text-sm font-semibold text-ink-soft">
        {t("condividi")}
      </span>
      <a
        className={btn}
        aria-label={t("condividiSuFacebook")}
        target="_blank"
        rel="noopener noreferrer"
        href={fbHref}
      >
        <FacebookIcon size={18} />
      </a>
      <a
        className={btn}
        aria-label={t("condividiSuWhatsapp")}
        target="_blank"
        rel="noopener noreferrer"
        href={waHref}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.13c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.26-4.35c0-4.54 3.7-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.23 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
        </svg>
      </a>
      <button
        type="button"
        className={btn}
        onClick={copy}
        aria-label={t("copiaLink")}
      >
        {copied ? (
          <Check size={18} className="text-teal" />
        ) : (
          <Link2 size={18} />
        )}
      </button>
    </div>
  );
}
