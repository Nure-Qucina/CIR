import "server-only";
import { cache } from "react";
import { reader } from "./reader";
import type { NavItem, SiteConfig, SocialLink } from "./types";

/**
 * Navigazione: tenuta in codice (non in CMS) così i redattori non possono
 * rompere il routing. Le rotte sono fisse; l'etichetta News è configurabile
 * via il campo `labelNews` del singleton site.
 */
const NAV_BASE: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Eventi", href: "/eventi" },
  { label: "News", href: "/news" },
  { label: "Contatti", href: "/contatti" },
];

const NAV_LEGALE: NavItem[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Cookie", href: "/cookie" },
  { label: "Termini", href: "/termini" },
];

// Valori di default (§8) usati come fallback se il singleton non è ancora seedato.
const DEFAULTS = {
  nome: "Comunità Islamica di Roma",
  sigla: "CIR",
  payoff: "Uniti per una comunità forte e consapevole",
  descrizione:
    "La Comunità Islamica di Roma (CIR) dà voce ai musulmani della capitale: 22 associazioni unite per diritti, dialogo e una città più giusta.",
  labelNews: "News",
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
  const nav = NAV_BASE.map((item) =>
    item.href === "/news" ? { ...item, label: labelNews } : item,
  );

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
    payoff: site?.payoff || DEFAULTS.payoff,
    descrizione: site?.descrizione || DEFAULTS.descrizione,
    labelNews,
    social,
    donazioniUrl: site?.donazioniUrl || DEFAULTS.donazioniUrl,
    contatti: {
      email,
      telefono,
      indirizzo,
      placeholder: !email && !telefono && !indirizzo,
    },
    nav,
    navLegale: NAV_LEGALE,
  };
});
