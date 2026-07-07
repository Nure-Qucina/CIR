import { getTranslations } from "next-intl/server";
import { Mail, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getSiteConfig } from "@/lib/content/site";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";
import type { Locale } from "@/i18n/routing";

/**
 * Footer istituzionale: payoff, social reali (FB/IG), link rapidi e legali,
 * © anno corrente. Motivo geometrico come firma del brand (watermark teal).
 */
export async function Footer({ locale }: { locale: Locale }) {
  const [t, tNav, tLegal, site] = await Promise.all([
    getTranslations({ locale, namespace: "common" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "legal" }),
    getSiteConfig(),
  ]);
  const anno = new Date().getFullYear();

  const socialIcon = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
  } as const;

  const navRapidi = [
    { href: "/chi-siamo", label: tNav("chiSiamo") },
    { href: "/eventi", label: tNav("eventi") },
    { href: "/news", label: site.labelNews },
    { href: "/contatti", label: tNav("contatti") },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-teal text-cream">
      {/* Watermark geometrico */}
      <div className="pointer-events-none absolute inset-0 text-cream opacity-[0.06]">
        <GeometricPattern size={88} id="footer-girih" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand + payoff */}
          <div className="lg:col-span-2">
            {/* Icona bianca (senza wordmark, coerente con l'header) ricolorata
                in crema via CSS mask — stesso colore del testo del footer.
                Sorgente monocromatica: la mask ne applica il colore esatto. */}
            <div
              aria-hidden="true"
              className="aspect-[503/208] h-14 bg-cream"
              style={{
                maskImage: "url(/LogoCirBiancoIcon.png)",
                maskRepeat: "no-repeat",
                maskSize: "contain",
                maskPosition: "left center",
                WebkitMaskImage: "url(/LogoCirBiancoIcon.png)",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskSize: "contain",
                WebkitMaskPosition: "left center",
              }}
            />
            <span className="sr-only">{site.nome}</span>
            <p className="mt-4 max-w-sm text-sm text-cream/80">
              {site.payoff}
            </p>
            <div className="mt-5 flex gap-3">
              {site.social.map((s) => {
                const Icon = socialIcon[s.piattaforma];
                return (
                  <a
                    key={s.piattaforma}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.piattaforma}
                    className="grid h-10 w-10 place-items-center rounded-lg bg-cream/10 transition-colors hover:bg-cream/20"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Contatti */}
          <div>
            <p className="text-xs font-semibold tracking-wider text-cream/60 uppercase">
              {tNav("contatti")}
            </p>
            <ul className="mt-4 flex flex-col gap-3 text-sm">
              {site.contatti.email && (
                <li>
                  <a
                    href={`mailto:${site.contatti.email}`}
                    className="flex items-start gap-2.5 text-cream/85 underline-offset-4 hover:text-cream hover:underline"
                  >
                    <Mail size={16} className="mt-0.5 shrink-0" aria-hidden />
                    {/* <wbr/> dopo la @: se l'email deve andare a capo, si
                        spezza lì (punto naturale) invece che a metà parola. */}
                    <span>
                      {site.contatti.email.split("@")[0]}
                      <wbr />@{site.contatti.email.split("@")[1]}
                    </span>
                  </a>
                </li>
              )}
              {site.contatti.telefono && (
                <li>
                  <a
                    href={`tel:${site.contatti.telefono.replace(/\s/g, "")}`}
                    className="flex items-center gap-2.5 text-cream/85 underline-offset-4 hover:text-cream hover:underline"
                  >
                    <Phone size={16} className="shrink-0" aria-hidden />
                    {site.contatti.telefono}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Link rapidi */}
          <nav aria-label={t("linkRapidi")}>
            <p className="text-xs font-semibold tracking-wider text-cream/60 uppercase">
              {t("naviga")}
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {navRapidi.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className="text-cream/85 underline-offset-4 hover:text-cream hover:underline"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-cream/15 pt-6 text-xs text-cream/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p>{t("tuttiIDirittiRiservati", { anno, nome: site.nome })}</p>
            {site.codiceFiscale && <p>C.F. {site.codiceFiscale}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href="/privacy"
              className="text-cream/85 underline-offset-4 hover:text-cream hover:underline"
            >
              {tLegal("privacyCookie")}
            </Link>
            <span aria-hidden="true" className="text-cream/40">
              ·
            </span>
            {/* Firma dell'agenzia: una riga sola, discreta — il racconto
                completo vive su qucina.io. Il punto finale fa parte del
                wordmark "Qucina." e chiude anche la frase. */}
            <p>
              {t("sitoRealizzatoDa")}{" "}
              <a
                href="https://www.qucina.io"
                target="_blank"
                rel="noopener"
                className="font-medium text-cream/85 underline-offset-4 hover:text-cream hover:underline"
              >
                Qucina.
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
