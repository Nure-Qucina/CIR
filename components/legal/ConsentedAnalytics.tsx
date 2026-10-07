"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CONSENT_CHANGE_EVENT, hasConsentFor } from "@/lib/cookie-consent";

/**
 * Vercel Web Analytics + Speed Insights, solo con il consenso "statistiche".
 *
 * Prima del consenso gli script non vengono nemmeno caricati (prima del 7/10
 * partivano sempre, anche dopo "Rifiuta"). Se il consenso arriva durante la
 * visita, il componente si monta e conta la pagina corrente; se viene
 * revocato, si smonta e `beforeSend` scarta qualsiasi invio residuo dello
 * script già caricato. Funzioni a livello di modulo: riferimenti stabili,
 * così le librerie non le registrano di nuovo a ogni render.
 */
function soloConConsenso<T>(event: T): T | null {
  return hasConsentFor("statistiche") ? event : null;
}

export function ConsentedAnalytics() {
  const [attive, setAttive] = useState(false);

  useEffect(() => {
    // Il consenso sta in un cookie: si legge solo dopo il mount.
    const aggiorna = () => setAttive(hasConsentFor("statistiche"));
    aggiorna();
    window.addEventListener(CONSENT_CHANGE_EVENT, aggiorna);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, aggiorna);
  }, []);

  if (!attive) return null;

  return (
    <>
      <Analytics beforeSend={soloConConsenso} />
      <SpeedInsights beforeSend={soloConConsenso} />
    </>
  );
}
