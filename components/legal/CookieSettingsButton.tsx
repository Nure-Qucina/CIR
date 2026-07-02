"use client";

import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OPEN_SETTINGS_EVENT } from "@/lib/cookie-consent";

/**
 * Pulsante "Gestisci preferenze cookie" (nella pagina Privacy e Cookie).
 * Riapre il banner di consenso (CookieBanner ascolta OPEN_SETTINGS_EVENT),
 * così l'utente può revocare o modificare il consenso in qualsiasi momento.
 */
export function CookieSettingsButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}
    >
      <Cookie size={16} aria-hidden />
      Gestisci preferenze cookie
    </Button>
  );
}
