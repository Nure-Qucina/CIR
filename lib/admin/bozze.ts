import "server-only";
import { KEYSTATIC_REPO } from "@/keystatic.config";

/**
 * Gestione bozze in blocco (/admin/bozze) — helper GitHub.
 *
 * Legge lo stato ATTUALE dei contenuti direttamente dal branch main via API
 * GitHub (non dal filesystem del bundle, che è fermo all'ultimo deploy) e
 * scrive tutte le modifiche in UN SOLO commit (Git Data API): un commit =
 * un solo deploy Vercel, qualunque sia il numero di bozze toccate.
 *
 * L'autenticazione riusa il cookie di sessione di Keystatic
 * (`keystatic-gh-access-token`, path "/", non-httpOnly): niente segreti
 * server-side, ogni azione avviene con i permessi GitHub del redattore —
 * se il suo account non può pushare, GitHub rifiuta il commit (403).
 */

const BRANCH = "main";
const API = "https://api.github.com";
const REPO = `${KEYSTATIC_REPO.owner}/${KEYSTATIC_REPO.name}`;

/** Directory dei contenuti gestiti dalla pagina bozze. */
const COLLECTIONS = [
  { dir: "content/articoli", tipo: "articolo" },
  { dir: "content/eventi", tipo: "evento" },
] as const;

export type TipoContenuto = (typeof COLLECTIONS)[number]["tipo"];

export type ContenutoBozza = {
  path: string; // es. content/articoli/slug.mdx
  slug: string;
  titolo: string;
  bozza: boolean;
  tipo: TipoContenuto;
};

export class GitHubApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function gh(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<unknown> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new GitHubApiError(res.status, await res.text());
  }
  return res.json();
}

/** Path ammessi in scrittura: solo file dentro le collection gestite. */
export function isPathGestito(path: string): boolean {
  return /^content\/(articoli|eventi)\/[^/\\]+\.(mdx|json)$/.test(path);
}

// --- Parser minimi (solo i campi che servono qui: titolo + bozza) ---------

function parseJsonEntry(src: string): { titolo: string; bozza: boolean } {
  const obj = JSON.parse(src) as Record<string, unknown>;
  return { titolo: String(obj.titolo ?? ""), bozza: Boolean(obj.bozza) };
}

/** Estrae il blocco frontmatter (senza i delimitatori ---). */
function frontmatterDi(src: string): string {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? m[1] : "";
}

function parseMdxEntry(src: string): { titolo: string; bozza: boolean } {
  const fm = frontmatterDi(src);
  const bozza = /^bozza:[ \t]*true[ \t]*$/m.test(fm);

  // titolo: 'x' / "x" / x — oppure blocco YAML folded (>- ecc.) su righe
  // indentate successive. Parser volutamente minimo: in caso di formato
  // imprevisto si ricade sullo slug (mostrato comunque nella UI).
  let titolo = "";
  const tm = fm.match(/^titolo:[ \t]*(.*)$/m);
  if (tm) {
    const v = tm[1].trim();
    if (/^[>|][+-]?$/.test(v)) {
      const dopo = fm.slice(fm.indexOf(tm[0]) + tm[0].length);
      const righe: string[] = [];
      for (const riga of dopo.split(/\r?\n/).slice(1)) {
        if (/^[ \t]+\S/.test(riga)) righe.push(riga.trim());
        else break;
      }
      titolo = righe.join(" ");
    } else {
      titolo = v.replace(/^['"]|['"]$/g, "");
    }
  }
  return { titolo, bozza };
}

// --- Scrittura del flag (senza toccare il resto del file) ------------------

function setBozzaJson(src: string, bozza: boolean): string {
  const obj = JSON.parse(src) as Record<string, unknown>;
  obj.bozza = bozza;
  return JSON.stringify(obj, null, 2) + "\n";
}

function setBozzaMdx(src: string, bozza: boolean): string {
  const m = src.match(/^(---\r?\n)([\s\S]*?)(\r?\n---)/);
  if (!m) return src; // niente frontmatter: non tocchiamo nulla
  let fm = m[2];
  if (/^bozza:.*$/m.test(fm)) {
    fm = fm.replace(/^bozza:.*$/m, `bozza: ${bozza}`);
  } else {
    fm = `bozza: ${bozza}\n${fm}`;
  }
  return m[1] + fm + src.slice(m[1].length + m[2].length);
}

export function conBozza(path: string, src: string, bozza: boolean): string {
  return path.endsWith(".json")
    ? setBozzaJson(src, bozza)
    : setBozzaMdx(src, bozza);
}

// --- Lettura elenco dal branch main ----------------------------------------

type GhContentItem = { name: string; path: string; type: string };
type GhFileContent = { content: string; encoding: string };

/** Contenuto raw (decodificato) di un file sul branch main. */
export async function leggiFile(token: string, path: string): Promise<string> {
  const file = (await gh(
    token,
    `/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
  )) as GhFileContent;
  return Buffer.from(file.content, "base64").toString("utf8");
}

/** Tutti gli articoli+eventi con lo stato bozza LIVE (da GitHub, non dal bundle). */
export async function elencaContenuti(
  token: string,
): Promise<ContenutoBozza[]> {
  const gruppi = await Promise.all(
    COLLECTIONS.map(async ({ dir, tipo }) => {
      const items = (await gh(
        token,
        `/repos/${REPO}/contents/${dir}?ref=${BRANCH}`,
      )) as GhContentItem[];
      const files = items.filter(
        (i) => i.type === "file" && /\.(mdx|json)$/.test(i.name),
      );
      return Promise.all(
        files.map(async (f): Promise<ContenutoBozza> => {
          const src = await leggiFile(token, f.path);
          const slug = f.name.replace(/\.(mdx|json)$/, "");
          try {
            const { titolo, bozza } = f.name.endsWith(".json")
              ? parseJsonEntry(src)
              : parseMdxEntry(src);
            return { path: f.path, slug, titolo: titolo || slug, bozza, tipo };
          } catch {
            // File illeggibile: mostrato con lo slug, stato "pubblicato".
            return { path: f.path, slug, titolo: slug, bozza: false, tipo };
          }
        }),
      );
    }),
  );
  return gruppi.flat();
}

// --- Commit unico (Git Data API) -------------------------------------------

type Modifica = { path: string; nuovoContenuto: string };

/** Crea UN commit su main con tutte le modifiche e aggiorna il ref. */
export async function commitBozze(
  token: string,
  modifiche: Modifica[],
  messaggio: string,
): Promise<void> {
  const ref = (await gh(token, `/repos/${REPO}/git/ref/heads/${BRANCH}`)) as {
    object: { sha: string };
  };
  const baseSha = ref.object.sha;

  const baseCommit = (await gh(
    token,
    `/repos/${REPO}/git/commits/${baseSha}`,
  )) as { tree: { sha: string } };

  const tree = (await gh(token, `/repos/${REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: modifiche.map((m) => ({
        path: m.path,
        mode: "100644",
        type: "blob",
        content: m.nuovoContenuto,
      })),
    }),
  })) as { sha: string };

  const commit = (await gh(token, `/repos/${REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: messaggio,
      tree: tree.sha,
      parents: [baseSha],
    }),
  })) as { sha: string };

  await gh(token, `/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha }),
  });
}
