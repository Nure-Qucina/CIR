"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ILLUSTRAZIONI } from "@/lib/carta";
import {
  AREE_PROFESSIONISTI,
  LINGUE,
  type AreaProfessionisti,
} from "@/lib/content/rete-opzioni";
import type { Professionista } from "@/lib/content/rete";
import { cn } from "@/lib/utils/cn";
import { Chip } from "./Chip";
import { ProfessionistaCard } from "./ProfessionistaCard";

const ILLUSTRAZIONE_AREA: Record<
  AreaProfessionisti,
  { src: string; width: number; height: number }
> = {
  legale: ILLUSTRAZIONI.bilancia,
  psicologia: ILLUSTRAZIONI.fumettoTeal,
  fisco: ILLUSTRAZIONI.documento,
  creativita: ILLUSTRAZIONI.creativita,
};

/**
 * Elenco dei professionisti: si sceglie l'area da quattro riquadri
 * illustrati, poi (facoltativo) la lingua parlata. Due card per riga su
 * computer, una sul telefono.
 */
export function ProfessionistiElenco({
  professionisti,
}: {
  professionisti: Professionista[];
}) {
  const t = useTranslations("rete.professionisti");
  const tl = useTranslations("rete.lingue");
  const [area, setArea] = useState<AreaProfessionisti | "tutte">("tutte");
  const [lingua, setLingua] = useState<string>("tutte");

  const aree = AREE_PROFESSIONISTI.filter((a) =>
    professionisti.some((p) => p.area === a.value),
  );
  // Filtro lingua: solo le lingue diverse dall'italiano che qualcuno parla davvero.
  const lingue = LINGUE.filter(
    (l) =>
      l.value !== "it" &&
      professionisti.some((p) => p.lingue.includes(l.value)),
  );
  const lista = professionisti.filter(
    (p) =>
      (area === "tutte" || p.area === area) &&
      (lingua === "tutte" ||
        p.lingue.includes(lingua as (typeof LINGUE)[number]["value"])),
  );

  return (
    <div className="flex flex-col gap-7">
      {aree.length > 1 && (
        <section
          aria-labelledby="scegli-area"
          className="flex flex-col gap-3.5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="scegli-area" className="text-ink text-xl font-extrabold">
              {t("scegliArea")}
            </h2>
            {area !== "tutte" && (
              <button
                type="button"
                onClick={() => setArea("tutte")}
                className="min-h-11 text-sm font-bold text-teal-700 underline underline-offset-4"
              >
                {t("mostraTutti")}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {aree.map((a) => {
              const img = ILLUSTRAZIONE_AREA[a.value];
              const attiva = area === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  aria-pressed={attiva}
                  onClick={() => setArea(attiva ? "tutte" : a.value)}
                  className={cn(
                    "bg-cream-50 flex min-w-0 items-center gap-3 rounded-md p-3 text-start transition-shadow sm:flex-col sm:items-start sm:gap-2 sm:p-5",
                    attiva
                      ? "shadow-[inset_0_0_0_3px_var(--color-teal),0_10px_24px_-12px_rgb(42_31_14/0.45)]"
                      : "shadow-[0_1px_2px_rgb(42_31_14/0.08),0_6px_16px_-10px_rgb(42_31_14/0.3)] hover:shadow-[0_1px_2px_rgb(42_31_14/0.08),0_12px_24px_-12px_rgb(42_31_14/0.4)]",
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center sm:h-28 sm:w-full sm:items-end">
                    <Image
                      src={img.src}
                      width={img.width}
                      height={img.height}
                      alt=""
                      sizes="(max-width: 640px) 44px, 160px"
                      className="max-h-full w-auto object-contain sm:h-[100px]"
                    />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-ink text-sm leading-tight font-extrabold sm:text-lg">
                      {t(`aree.${a.value}`)}
                    </span>
                    <span className="text-ink-soft hidden text-sm leading-snug sm:block">
                      {t(`areeDesc.${a.value}`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {lingue.length > 0 && (
          <>
            <span className="text-ink text-sm font-bold">{t("parla")}</span>
            <div
              role="group"
              aria-label={t("filtroLingua")}
              className="-mx-4 flex max-w-[calc(100%+2rem)] min-w-0 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:max-w-full sm:flex-wrap sm:px-0"
            >
              <Chip
                attivo={lingua === "tutte"}
                onClick={() => setLingua("tutte")}
              >
                {t("tutteLingue")}
              </Chip>
              {lingue.map((l) => (
                <Chip
                  key={l.value}
                  attivo={lingua === l.value}
                  onClick={() => setLingua(l.value)}
                >
                  {tl(l.value).replace(/^./, (c) => c.toLocaleUpperCase())}
                </Chip>
              ))}
            </div>
          </>
        )}
        <p className="text-ink-soft ms-auto text-sm" aria-live="polite">
          {t("conteggio", { n: lista.length })}
        </p>
      </div>

      {area === "legale" && (
        <aside className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-md bg-orange-100 px-5 py-4">
          <p className="text-ink max-w-2xl text-[15px] leading-relaxed">
            <b>{t("segnalaTitolo")}</b> {t("segnalaTesto")}
          </p>
          <Link
            href="/contatti"
            className="bg-ink text-cream inline-flex min-h-11 items-center rounded-full px-5 text-sm font-bold"
          >
            {t("segnalaCta")}
          </Link>
        </aside>
      )}

      <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>li]:min-w-0">
        {lista.map((p) => (
          <li key={p.slug}>
            <ProfessionistaCard p={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
