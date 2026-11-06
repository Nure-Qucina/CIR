import { cn } from "@/lib/utils/cn";

type Azione = {
  href: string;
  label: string;
  esterno?: boolean;
  primario?: boolean;
};

/**
 * Barra fissa in fondo allo schermo, solo su telefono: le azioni principali
 * della scheda (Indicazioni, Chiama, WhatsApp…) restano sempre a portata di
 * pollice mentre si scorre.
 */
export function BarraAzioni({
  azioni,
  nota,
}: {
  azioni: (Azione | false | undefined | "")[];
  nota?: string;
}) {
  const lista = azioni.filter(Boolean) as Azione[];
  if (lista.length === 0) return null;
  return (
    <div className="bg-cream-50 border-border fixed inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_-12px_rgb(42_31_14/0.35)] md:hidden">
      {nota && (
        <p className="text-center text-xs font-semibold text-orange-800">
          {nota}
        </p>
      )}
      <div className="flex gap-2">
        {lista.map((a) => (
          <a
            key={a.href}
            href={a.href}
            {...(a.esterno
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={cn(
              "flex min-h-12 flex-1 items-center justify-center rounded-full px-3 text-[15px] font-bold",
              a.primario
                ? "bg-orange text-ink"
                : "ring-teal text-teal-700 ring-[1.5px] ring-inset",
            )}
          >
            {a.label}
          </a>
        ))}
      </div>
    </div>
  );
}
