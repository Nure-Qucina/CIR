/** Configurazione v1 condivisa. Tutti gli importi sono in centesimi di euro. */
export const DONATION_ROUTE = "/donazioni";
export const DONATION_CURRENCY = "eur";
export const DONATION_PRESETS_CENTS = [1000, 2500, 5000, 10000] as const;
export const DONATION_DEFAULT_CENTS = 2500;
export const DONATION_MIN_CENTS = 100;
export const DONATION_MAX_CENTS = 500000;

/** Da chiamare sul server con process.env.DONATIONS_ENABLED: solo "true" abilita. */
export function isDonationsEnabled(value: unknown): boolean {
  return value === "true";
}
