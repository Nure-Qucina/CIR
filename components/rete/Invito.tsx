import { Link } from "@/i18n/navigation";

/** Riquadro salvia con invito all'azione (diventa sponsor, segnala, ecc.). */
export function Invito({
  titolo,
  testo,
  cta,
  href,
}: {
  titolo: string;
  testo: string;
  cta: string;
  href: string;
}) {
  return (
    <aside className="bg-teal text-cream flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-md px-6 py-7 sm:px-8">
      <div className="flex max-w-xl flex-col gap-1.5">
        <h2 className="text-xl font-extrabold text-white">{titolo}</h2>
        <p className="text-[15px] leading-relaxed">{testo}</p>
      </div>
      <Link
        href={href}
        className="bg-orange text-ink hover:bg-orange-dark inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-bold"
      >
        {cta}
      </Link>
    </aside>
  );
}
