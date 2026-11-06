"use client";

import { useTranslations } from "next-intl";
import { Languages, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Professionista } from "@/lib/content/rete";
import { telHref as tel, whatsappHref as wa } from "@/lib/content/rete-link";
import { Monogramma } from "./Monogramma";

/** Dove riceve: «In studio e online», «Online», oppure la zona. */
export function useDove() {
  const t = useTranslations("rete.professionisti");
  return (p: Professionista) =>
    p.inStudio && p.online
      ? t("inStudioEOnline")
      : p.online
        ? t("soloOnline")
        : p.zona || t("inStudio");
}

/**
 * Card del professionista: foto (o logo per le aziende), chi è, perché lo
 * consigliamo e, in fondo, il «tagliando» con l'agevolazione e i contatti.
 */
export function ProfessionistaCard({ p }: { p: Professionista }) {
  const t = useTranslations("rete.professionisti");
  const dove = useDove();
  return (
    <article className="foglio flex h-full flex-col overflow-hidden">
      <div className="flex flex-1 items-start gap-4 px-5 pt-5 pb-5 sm:gap-5 sm:px-6">
        <Monogramma
          nome={p.nome}
          src={p.immagine}
          size={80}
          forma={p.tipo === "azienda" ? "quadrato" : "tondo"}
          className={
            p.tipo === "persona"
              ? "shadow-[0_0_0_3px_#fdfaf5,0_0_0_4px_#e7ddcf]"
              : undefined
          }
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="text-ink text-lg leading-snug font-bold">
            <Link
              href={`/professionisti/${p.slug}`}
              className="underline-offset-4 hover:underline"
            >
              {p.nome}
            </Link>
          </h3>
          <p className="text-ink-soft text-sm leading-snug">
            {p.ruolo} · {dove(p)}
          </p>
          <p className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] font-semibold text-teal-700">
            {p.albo && (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} className="shrink-0" aria-hidden />
                {p.albo}
              </span>
            )}
            {p.lingue.length > 0 && (
              <span
                className="inline-flex items-center gap-1.5"
                title={t("filtroLingua")}
              >
                <Languages size={14} className="shrink-0" aria-hidden />
                {p.lingue.map((l) => l.toUpperCase()).join(" · ")}
              </span>
            )}
          </p>
          {p.perche && (
            <p className="text-ink-soft mt-1 font-serif text-[15px] leading-snug italic">
              «{p.perche}»
            </p>
          )}
        </div>
      </div>

      {(p.agevolazione || p.contatti.telefono || p.contatti.whatsapp) && (
        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3 border-t-2 border-dashed border-orange-500 bg-orange-100 px-5 py-3.5 sm:px-6">
          <span
            aria-hidden
            className="bg-cream absolute -start-2.5 -top-2.5 h-5 w-5 rounded-full"
          />
          <span
            aria-hidden
            className="bg-cream absolute -end-2.5 -top-2.5 h-5 w-5 rounded-full"
          />
          {p.agevolazione && (
            <p className="flex min-w-0 flex-[1_1_220px] items-center gap-3">
              <span className="sr-only">{t("agevolazione")}: </span>
              <span className="text-ink shrink-0 text-[26px] leading-none font-extrabold">
                {p.agevolazione.breve}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-ink text-sm leading-snug font-semibold">
                  {p.agevolazione.suCosa}
                </span>
                <span className="text-xs text-orange-800">
                  {t("diCheVieni")}
                </span>
              </span>
            </p>
          )}
          <span className="flex gap-2">
            {p.contatti.telefono && (
              <a
                href={tel(p.contatti.telefono)}
                className="bg-ink text-cream hover:bg-ink-700 inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold"
              >
                {t("chiama")}
              </a>
            )}
            {p.contatti.whatsapp && (
              <a
                href={wa(p.contatti.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink ring-ink inline-flex min-h-11 items-center rounded-full px-4 text-sm font-bold ring-[1.5px] ring-inset hover:bg-orange-200"
              >
                {t("whatsapp")}
              </a>
            )}
          </span>
        </div>
      )}
    </article>
  );
}
