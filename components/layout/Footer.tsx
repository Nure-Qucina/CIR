import Link from "next/link";
import { getSiteConfig } from "@/lib/content/site";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";

/**
 * Footer istituzionale: payoff, social reali (FB/IG), link rapidi e legali,
 * © anno corrente. Motivo geometrico come firma del brand (watermark teal).
 */
export async function Footer() {
  const site = await getSiteConfig();
  const anno = new Date().getFullYear();

  const socialIcon = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
  } as const;

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

          {/* Link rapidi */}
          <nav aria-label="Link rapidi">
            <p className="text-xs font-semibold tracking-wider text-cream/60 uppercase">
              Naviga
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {site.nav
                .filter((n) => n.href !== "/")
                .map((n) => (
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

          {/* Legali */}
          <nav aria-label="Informazioni legali">
            <p className="text-xs font-semibold tracking-wider text-cream/60 uppercase">
              Legale
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {site.navLegale.map((n) => (
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

        <div className="mt-12 flex flex-col gap-2 border-t border-cream/15 pt-6 text-xs text-cream/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {anno} {site.nome}. Tutti i diritti riservati.
          </p>
          <p>{site.payoff}</p>
        </div>
      </div>
    </footer>
  );
}
