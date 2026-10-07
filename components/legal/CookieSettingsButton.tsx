"use client";

import { Cookie } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { OPEN_SETTINGS_EVENT } from "@/lib/cookie-consent";

/**
 * Riapre il banner di consenso (CookieBanner ascolta OPEN_SETTINGS_EVENT),
 * così l'utente può revocare o modificare il consenso in qualsiasi momento.
 *  - `variant="button"`: pulsante "Gestisci preferenze cookie" (pagina Privacy).
 *  - `variant="link"`: link testuale "Preferenze cookie" (footer di ogni
 *    pagina, come chiedono le linee guida del Garante), stile dal chiamante.
 */
export function CookieSettingsButton({
  variant = "button",
  className,
}: {
  variant?: "button" | "link";
  className?: string;
}) {
  const t = useTranslations("cookieBanner");
  const apri = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));

  if (variant === "link") {
    return (
      <button type="button" onClick={apri} className={className}>
        {t("preferenze")}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={apri}
      className={className}
    >
      <Cookie size={16} aria-hidden />
      {t("gestisciPreferenze")}
    </Button>
  );
}
