import { cookies } from "next/headers";
import {
  GitHubApiError,
  elencaContenuti,
  type ContenutoBozza,
} from "@/lib/admin/bozze";
import { salvaBozze } from "./actions";

/**
 * /admin/bozze — gestione bozze in blocco per la redazione.
 *
 * Elenca tutti gli articoli/eventi con lo stato LIVE letto da GitHub (main),
 * permette di spuntare/togliere più bozze e salva tutto in UN commit → UN
 * solo deploy. Richiede il login GitHub di Keystatic (riusa il suo cookie);
 * chi non ha permessi di scrittura sul repo viene rifiutato da GitHub.
 */
export const dynamic = "force-dynamic";

const ESITI: Record<string, { testo: string; ok: boolean }> = {
  ok: { testo: "Modifiche salvate in un unico commit — il deploy è partito, online tra 1-2 minuti.", ok: true },
  nessuna: { testo: "Nessuna modifica da salvare.", ok: true },
  login: { testo: "Sessione GitHub assente o scaduta: apri /keystatic, fai login, poi torna qui.", ok: false },
  permessi: { testo: "Il tuo account GitHub non ha i permessi di scrittura sul repo.", ok: false },
  errore: { testo: "Errore imprevisto durante il salvataggio: riprova.", ok: false },
};

function Riga({ c }: { c: ContenutoBozza }) {
  return (
    <li>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-ink/10 bg-white/60 px-4 py-3 transition-colors hover:bg-white">
        <input
          type="checkbox"
          name={`bozza:${c.path}`}
          defaultChecked={c.bozza}
          className="h-5 w-5 shrink-0 accent-orange"
        />
        <input type="hidden" name="path" value={c.path} />
        <input type="hidden" name={`orig:${c.path}`} value={String(c.bozza)} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{c.titolo}</span>
          <span className="block truncate text-xs text-ink-soft">{c.slug}</span>
        </span>
        {c.bozza && (
          <span className="ms-auto shrink-0 rounded-full bg-orange/15 px-2.5 py-0.5 text-xs font-semibold text-orange-dark">
            bozza
          </span>
        )}
      </label>
    </li>
  );
}

export default async function BozzePage({
  searchParams,
}: {
  searchParams: Promise<{ esito?: string; n?: string }>;
}) {
  const { esito } = await searchParams;
  const messaggio = esito ? ESITI[esito] : undefined;

  const token = (await cookies()).get("keystatic-gh-access-token")?.value;

  let contenuti: ContenutoBozza[] | null = null;
  let erroreLettura: string | null = null;
  if (token) {
    try {
      contenuti = await elencaContenuti(token);
    } catch (err) {
      erroreLettura =
        err instanceof GitHubApiError && err.status === 401
          ? "login"
          : "lettura";
    }
  }

  const serveLogin = !token || erroreLettura === "login";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold tracking-wider text-teal uppercase">
        Strumenti redazione
      </p>
      <h1 className="mt-1 text-2xl font-bold">Gestione bozze</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Spunta i contenuti da mettere in bozza (nascosti dal sito), togli la
        spunta per pubblicarli. <strong>Salva</strong> applica tutto insieme:
        un solo commit, un solo deploy — qualunque sia il numero di modifiche.
      </p>

      {messaggio && (
        <p
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            messaggio.ok
              ? "border-teal/30 bg-teal/10 text-teal-dark"
              : "border-orange/40 bg-orange/10 text-orange-dark"
          }`}
        >
          {messaggio.testo}
        </p>
      )}

      {serveLogin ? (
        <div className="mt-8 rounded-xl border border-ink/10 bg-white/60 p-6 text-sm">
          <p>
            Per usare questa pagina serve la sessione GitHub di Keystatic:
          </p>
          <ol className="mt-3 list-decimal space-y-1 ps-5 text-ink-soft">
            <li>
              Apri{" "}
              <a href="/keystatic" className="font-medium text-teal underline underline-offset-4">
                /keystatic
              </a>{" "}
              e accedi con GitHub.
            </li>
            <li>Torna su questa pagina e ricaricala.</li>
          </ol>
        </div>
      ) : erroreLettura ? (
        <p className="mt-8 rounded-lg border border-orange/40 bg-orange/10 px-4 py-3 text-sm text-orange-dark">
          Impossibile leggere i contenuti da GitHub: riprova tra qualche
          istante.
        </p>
      ) : (
        <form action={salvaBozze} className="mt-8">
          {(["articolo", "evento"] as const).map((tipo) => {
            const gruppo = contenuti!.filter((c) => c.tipo === tipo);
            if (gruppo.length === 0) return null;
            return (
              <section key={tipo} className="mt-8 first:mt-0">
                <h2 className="text-xs font-semibold tracking-wider text-ink-soft uppercase">
                  {tipo === "articolo" ? "Articoli e comunicati" : "Eventi"}
                </h2>
                <ul className="mt-3 space-y-2">
                  {gruppo
                    .sort((a, b) => a.titolo.localeCompare(b.titolo, "it"))
                    .map((c) => (
                      <Riga key={c.path} c={c} />
                    ))}
                </ul>
              </section>
            );
          })}

          <div className="mt-10 flex items-center gap-4">
            <button
              type="submit"
              className="rounded-lg bg-orange px-6 py-2.5 font-semibold text-ink transition-colors hover:bg-orange-dark"
            >
              Salva
            </button>
            <a
              href="/keystatic"
              className="text-sm text-teal underline underline-offset-4 hover:text-teal-dark"
            >
              ← Torna a Keystatic
            </a>
          </div>
        </form>
      )}
    </main>
  );
}
