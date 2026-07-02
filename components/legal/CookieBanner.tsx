"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import {
  readConsent,
  writeConsent,
  OPEN_SETTINGS_EVENT,
} from "@/lib/cookie-consent";

/**
 * Banner consenso cookie — GDPR compliant, on-brand.
 *
 *  - Compare al primo accesso (nessun consenso registrato) e riapribile da
 *    ovunque con `window.dispatchEvent(new Event("open-cookie-settings"))`
 *    (vedi CookieSettingsButton, nella pagina Privacy e Cookie).
 *  - "Accetta tutti" e "Rifiuta tutti" hanno pari prominenza (linee guida
 *    EDPB: rifiutare dev'essere facile quanto accettare).
 *  - Statistiche e Marketing sono OFF di default; i Necessari sono bloccati
 *    su ON. Nessun cookie non essenziale viene impostato prima del consenso
 *    (oggi il sito non ne usa affatto — vedi lib/cookie-consent.ts).
 *  - Non bloccante (aria-modal="false"): non oscura la pagina, ma resta finché
 *    l'utente non compie una scelta esplicita (nessun "chiudi = consenso").
 */
export function CookieBanner() {
  const t = useTranslations("cookieBanner");
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [statistiche, setStatistiche] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mostra al primo accesso; ascolta la riapertura dalle preferenze.
  useEffect(() => {
    // Sync con uno store client-only (cookie): non leggibile in render SSR,
    // va deciso dopo il mount — eccezione legittima alla regola.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!readConsent()) setVisible(true);

    const reopen = () => {
      const current = readConsent();
      setStatistiche(current?.statistiche ?? false);
      setMarketing(current?.marketing ?? false);
      setDetails(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  // Focus sul pannello quando compare (annuncio agli screen reader / tastiera).
  useEffect(() => {
    if (visible) panelRef.current?.focus();
  }, [visible]);

  function salva(prefs: { statistiche: boolean; marketing: boolean }) {
    writeConsent(prefs);
    setVisible(false);
    setDetails(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-titolo"
      aria-describedby="cookie-banner-desc"
      tabIndex={-1}
      className={cn(
        "cookie-banner fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-border",
        "bg-cream p-5 shadow-xl outline-none sm:inset-x-auto sm:start-4 sm:bottom-4",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
          <Cookie size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2
            id="cookie-banner-titolo"
            className="text-base font-bold text-ink"
          >
            {t("titolo")}
          </h2>
          <p
            id="cookie-banner-desc"
            className="mt-1 text-sm leading-relaxed text-ink-soft"
          >
            {t.rich("descrizione", {
              link: (chunks) => (
                <Link
                  href="/privacy"
                  className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>

          {details && (
            <div className="mt-4 space-y-2">
              <CategoryRow
                titolo={t("necessariTitolo")}
                descrizione={t("necessariDesc")}
                checked
                locked
              />
              <CategoryRow
                titolo={t("statisticheTitolo")}
                descrizione={t("statisticheDesc")}
                checked={statistiche}
                onChange={setStatistiche}
              />
              <CategoryRow
                titolo={t("marketingTitolo")}
                descrizione={t("marketingDesc")}
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {/* Pari prominenza: Accetta e Rifiuta stessa variante e dimensione. */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => salva({ statistiche: true, marketing: true })}
            >
              {t("accettaTutti")}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => salva({ statistiche: false, marketing: false })}
            >
              {t("rifiutaTutti")}
            </Button>
            {details ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => salva({ statistiche, marketing })}
              >
                {t("salvaPreferenze")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDetails(true)}
              >
                {t("personalizza")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  titolo,
  descrizione,
  checked,
  locked,
  onChange,
}: {
  titolo: string;
  descrizione: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border border-border bg-cream-50 p-3",
        locked ? "cursor-not-allowed" : "cursor-pointer",
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{titolo}</span>
        <span className="block text-xs text-ink-soft">{descrizione}</span>
      </span>
      {/* Toggle accessibile: input reale + traccia stilizzata via peer. */}
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={locked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "h-6 w-11 rounded-full bg-ink-200 transition-colors",
            "peer-checked:bg-teal peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal",
            "after:absolute after:top-0.5 after:start-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:content-['']",
            "peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5",
            locked && "opacity-70",
          )}
        />
      </span>
    </label>
  );
}
