"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CoverImage } from "@/components/ui/CoverImage";
import { GRUPPI_SPONSOR } from "@/lib/content/rete-opzioni";
import type { Sponsor } from "@/lib/content/rete";
import { Chip } from "./Chip";
import { Monogramma } from "./Monogramma";

/** Vetrina degli sponsor: filtro per categoria + card con foto, tutte alla pari. */
export function SponsorElenco({ sponsor }: { sponsor: Sponsor[] }) {
  const t = useTranslations("rete.sponsor");
  const [gruppo, setGruppo] = useState<string>("tutti");
  const presenti = GRUPPI_SPONSOR.filter((g) =>
    sponsor.some((s) => s.gruppo === g.value),
  );
  const lista = sponsor.filter(
    (s) => gruppo === "tutti" || s.gruppo === gruppo,
  );

  return (
    <div className="flex flex-col gap-6">
      {presenti.length > 1 && (
        <div
          role="group"
          aria-label={t("filtro")}
          className="-mx-4 flex max-w-[calc(100%+2rem)] min-w-0 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:max-w-full sm:flex-wrap sm:px-0"
        >
          <Chip attivo={gruppo === "tutti"} onClick={() => setGruppo("tutti")}>
            {t("tutti")}
          </Chip>
          {presenti.map((g) => (
            <Chip
              key={g.value}
              attivo={gruppo === g.value}
              onClick={() => setGruppo(g.value)}
            >
              {t(`gruppi.${g.value}`)}
            </Chip>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 [&>li]:min-w-0">
        {lista.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/sponsor/${s.slug}`}
              className="foglio group flex h-full flex-col overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <CoverImage
                  src={s.foto[0]}
                  alt={t("fotoDi", { nome: s.nome })}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <span className="absolute start-3 top-3 rounded-full shadow-[0_2px_8px_rgb(42_31_14/0.25)]">
                  <Monogramma nome={s.nome} src={s.logo} size={46} />
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-1.5 px-4 pt-4 pb-5">
                <span className="self-start rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                  {s.tipo}
                </span>
                <h2 className="text-ink text-lg font-bold group-hover:underline group-hover:underline-offset-4">
                  {s.nome}
                </h2>
                {s.quartiere && (
                  <p className="text-ink-soft text-sm">{s.quartiere}</p>
                )}
                {s.vantaggio && (
                  <p className="mt-1 text-sm font-bold text-orange-700">
                    {s.vantaggio}
                  </p>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {lista.length === 0 && (
        <p className="text-ink-soft">{t("nessunRisultato")}</p>
      )}
    </div>
  );
}
