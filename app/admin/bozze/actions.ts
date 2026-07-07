"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  GitHubApiError,
  commitBozze,
  conBozza,
  isPathGestito,
  leggiFile,
} from "@/lib/admin/bozze";

/**
 * Applica in blocco lo stato bozza scelto nella pagina /admin/bozze.
 * Solo i contenuti effettivamente cambiati vengono riscritti, tutti in un
 * unico commit → un solo deploy Vercel.
 */
export async function salvaBozze(formData: FormData): Promise<void> {
  const token = (await cookies()).get("keystatic-gh-access-token")?.value;
  if (!token) redirect("/admin/bozze?esito=login");

  // Ricostruisce le scelte: per ogni path, stato desiderato vs originale.
  const modifiche: { path: string; bozza: boolean }[] = [];
  for (const path of formData.getAll("path").map(String)) {
    if (!isPathGestito(path)) continue; // niente scritture fuori da content/
    const desiderato = formData.get(`bozza:${path}`) !== null;
    const originale = formData.get(`orig:${path}`) === "true";
    if (desiderato !== originale) modifiche.push({ path, bozza: desiderato });
  }

  if (modifiche.length === 0) redirect("/admin/bozze?esito=nessuna");

  try {
    // Rilegge ogni file fresco da main (evita di sovrascrivere modifiche
    // fatte nel frattempo da Keystatic) e cambia solo il flag bozza.
    const contenuti = await Promise.all(
      modifiche.map(async (m) => ({
        path: m.path,
        nuovoContenuto: conBozza(m.path, await leggiFile(token, m.path), m.bozza),
      })),
    );

    const slugs = modifiche
      .map((m) => m.path.replace(/^content\/[^/]+\//, "").replace(/\.\w+$/, ""))
      .join(", ");
    await commitBozze(
      token,
      contenuti,
      `Bozze: aggiorna ${modifiche.length} contenut${modifiche.length === 1 ? "o" : "i"} (${slugs})`,
    );
  } catch (err) {
    if (err instanceof GitHubApiError) {
      if (err.status === 401) redirect("/admin/bozze?esito=login");
      if (err.status === 403 || err.status === 404)
        redirect("/admin/bozze?esito=permessi");
    }
    redirect("/admin/bozze?esito=errore");
  }

  redirect(`/admin/bozze?esito=ok&n=${modifiche.length}`);
}
