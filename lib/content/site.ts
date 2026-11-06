import "server-only";
import { cache } from "react";
import type { Metadata } from "next";
import { reader } from "./reader";
import type { SiteConfig, SocialLink } from "./types";

// Valori di default (§8) usati come fallback se il singleton non è ancora seedato.
const DEFAULTS = {
  nome: "Comunità Islamica di Roma",
  sigla: "CIR",
  payoff: "Uniti per una comunità forte e consapevole",
  descrizione:
    "La Comunità Islamica di Roma (CIR) dà voce ai musulmani della capitale: 22 associazioni unite per diritti, dialogo e una città più giusta.",
  labelNews: "News",
  // Fallback legacy: campagna esterna. I CTA pubblici usano /donazioni.
  donazioniUrl:
    "https://www.launchgood.com/v4/campaign/sostieni_cir_per_crescere",
  social: [
    {
      piattaforma: "facebook",
      url: "https://www.facebook.com/profile.php?id=61584109545467",
    },
    {
      piattaforma: "instagram",
      url: "https://www.instagram.com/comunita_islamica_roma/",
    },
  ] as SocialLink[],
};

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  const site = await reader.singletons.site.read();

  const labelNews = site?.labelNews || DEFAULTS.labelNews;

  const social: SocialLink[] =
    site?.social && site.social.length > 0
      ? site.social.map((s) => ({
          piattaforma: s.piattaforma as SocialLink["piattaforma"],
          url: s.url ?? "",
        }))
      : DEFAULTS.social;

  const email = site?.contatti?.email?.trim() || null;
  const telefono = site?.contatti?.telefono?.trim() || null;
  const indirizzo = site?.contatti?.indirizzo?.trim() || null;

  return {
    nome: site?.nome || DEFAULTS.nome,
    sigla: site?.sigla || DEFAULTS.sigla,
    codiceFiscale: site?.codiceFiscale?.trim() || null,
    payoff: site?.payoff || DEFAULTS.payoff,
    descrizione: site?.descrizione || DEFAULTS.descrizione,
    labelNews,
    social,
    donazioniUrl: site?.donazioniUrl || DEFAULTS.donazioniUrl,
    reteVisibile: site?.reteVisibile ?? false,
    contatti: {
      email,
      telefono,
      indirizzo,
      placeholder: !email && !telefono && !indirizzo,
    },
  };
});

/**
 * Robots delle pagine «La rete»: finché l'interruttore in Keystatic è spento
 * le pagine si aprono col link diretto (per controllare i contenuti) ma
 * Google non le indicizza.
 */
export async function robotsRete(): Promise<Metadata["robots"]> {
  const { reteVisibile } = await getSiteConfig();
  return reteVisibile ? undefined : { index: false, follow: false };
}
