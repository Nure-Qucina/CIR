"use client";

import { useTranslations } from "next-intl";
import { CalendarPlus, Download } from "lucide-react";

/**
 * Pulsanti "Aggiungi a Google Calendar" e download .ics.
 * Il contenuto .ics è generato lato server e passato come stringa, così il
 * download funziona senza chiamate di rete (Blob locale).
 */
export function AddToCalendar({
  ics,
  googleUrl,
  fileName,
}: {
  ics: string;
  googleUrl: string;
  fileName: string;
}) {
  const t = useTranslations("eventi");
  function downloadIcs() {
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-dark"
      >
        <CalendarPlus size={16} aria-hidden />
        {t("aggiungiAGoogleCalendar")}
      </a>
      <button
        type="button"
        onClick={downloadIcs}
        className="inline-flex items-center gap-2 rounded-xl bg-transparent px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-inset ring-teal transition-colors hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
      >
        <Download size={16} aria-hidden />
        {t("scaricaIcs")}
      </button>
    </div>
  );
}
