import { Info } from "lucide-react";

/** Avviso: il testo legale definitivo è ⚠️ DA FORNIRE dal cliente. */
export function LegalNotice() {
  return (
    <div className="mb-8 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
      <Info size={18} className="mt-0.5 shrink-0 text-orange-700" aria-hidden />
      <p className="text-ink">
        <strong>Testo provvisorio.</strong> Questa informativa va sostituita con
        il testo legale definitivo fornito dal CIR (verifica con un consulente
        privacy/legale prima della pubblicazione).
      </p>
    </div>
  );
}
