/**
 * Keystatic "fail closed" (audit 6/11/2026, P1.4).
 *
 * keystatic.config.ts sceglie lo storage guardando solo
 * NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG: se manca usa "local", che non chiede
 * login. Va bene sul computer di chi sviluppa, non su un deploy Vercel
 * (produzione o anteprima): lì, senza configurazione GitHub, la redazione
 * viene spenta (pagina /keystatic con un avviso, API che rispondono 503).
 * Il sito pubblico continua a funzionare e a pubblicarsi normalmente.
 *
 * Solo lato server: VERCEL non è disponibile nel bundle del browser.
 */
export function keystaticChiuso(
  env: Record<string, string | undefined> = process.env,
): boolean {
  // Più segnali: le variabili di sistema Vercel dipendono da un'impostazione
  // del progetto ("Enable access to System Environment Variables").
  const suVercel =
    env.VERCEL === "1" ||
    Boolean(env.VERCEL_ENV) ||
    Boolean(env.VERCEL_URL) ||
    Boolean(env.VERCEL_REGION);
  // Stessa regola di USE_GITHUB_STORAGE in keystatic.config.ts.
  const storageGithub = Boolean(env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG);
  return suVercel && !storageGithub;
}

export const KEYSTATIC_CHIUSO_MESSAGGIO =
  "Redazione non disponibile: la configurazione GitHub di Keystatic manca su questo deploy.";
