import { cn } from "@/lib/utils/cn";

/**
 * Elenco dei cookie e degli strumenti simili usati dal sito, per la cookie
 * policy (pagina Privacy e Cookie). Va tenuto allineato al codice: se si
 * aggiunge uno script o un cookie, si aggiunge una riga qui (e, se non è
 * tecnico, una categoria nel banner, vedi lib/cookie-consent.ts).
 * Testo in italiano come il resto dell'informativa.
 */
type Strumento = {
  nome: string;
  fornitore: string;
  /** Solo i facoltativi richiedono il consenso. */
  facoltativo?: boolean;
  tipo: string;
  scopo: string;
  durata: string;
};

const STRUMENTI: Strumento[] = [
  {
    nome: "cir-cookie-consent",
    fornitore: "CIR (questo sito)",
    tipo: "Cookie tecnico",
    scopo: "Ricorda le tue scelte sui cookie e sulle statistiche.",
    durata: "6 mesi",
  },
  {
    nome: "NEXT_LOCALE",
    fornitore: "CIR (questo sito)",
    tipo: "Cookie tecnico",
    scopo:
      "Ricorda la lingua che hai scelto, quando è diversa da quella del tuo browser.",
    durata: "Fino alla chiusura del browser",
  },
  {
    nome: "cir_donation_session",
    fornitore: "CIR (questo sito)",
    tipo: "Cookie tecnico",
    scopo:
      "Protegge il modulo di donazione da richieste contraffatte e invii ripetuti. Solo nella pagina Donazioni.",
    durata: "30 minuti",
  },
  {
    nome: "__stripe_mid, __stripe_sid e cookie di stripe.com",
    fornitore: "Stripe",
    tipo: "Cookie tecnici",
    scopo:
      "Prevenzione delle frodi nei pagamenti. Solo quando avvii il pagamento di una donazione.",
    durata: "Fino a 1 anno (__stripe_mid), 30 minuti (__stripe_sid)",
  },
  {
    nome: "Cloudflare Turnstile",
    fornitore: "Cloudflare",
    tipo: "Strumento tecnico, senza cookie",
    scopo:
      "Verifica che a compilare il modulo di donazione sia una persona e non un programma automatico, leggendo alcuni dati tecnici del browser.",
    durata: "Il tempo della verifica",
  },
  {
    nome: "Vercel Web Analytics e Speed Insights",
    fornitore: "Vercel",
    facoltativo: true,
    tipo: "Statistiche, senza cookie",
    scopo:
      "Contano visite e pagine lette e misurano i tempi di caricamento, in forma aggregata.",
    durata: "Codice temporaneo che si azzera ogni 24 ore",
  },
];

export function ElencoCookie({ className }: { className?: string }) {
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {STRUMENTI.map((s) => (
        <li key={s.nome} className="foglio p-5">
          <p className="text-ink font-mono text-sm font-semibold break-words">
            {s.nome}
          </p>
          <p
            className={cn(
              "mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
              s.facoltativo
                ? "bg-orange-50 text-orange-700"
                : "bg-teal/10 text-teal-700",
            )}
          >
            {s.facoltativo ? "Solo con il tuo consenso" : "Sempre attivo"}
          </p>
          <dl className="text-ink-soft mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-ink font-semibold">Tipo e fornitore</dt>
              <dd>
                {s.tipo} · {s.fornitore}
              </dd>
            </div>
            <div>
              <dt className="text-ink font-semibold">A cosa serve</dt>
              <dd>{s.scopo}</dd>
            </div>
            <div>
              <dt className="text-ink font-semibold">Durata</dt>
              <dd>{s.durata}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
