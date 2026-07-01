import { getSiteConfig } from "@/lib/content/site";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";

/**
 * Header sticky con navigazione principale + CTA "Dona" in evidenza (arancione).
 * Server Component: legge la config dal content layer; l'unica parte client è
 * il menu mobile.
 */
export async function Header() {
  const { nav, donazioniUrl } = await getSiteConfig();

  // Sfondo solido (niente backdrop-filter: creerebbe un containing block che
  // rompe il pannello fixed del menu mobile).
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-cream">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Due wrapper flex-1 di uguale larghezza ai lati: la nav (larghezza
            naturale) resta esattamente al centro del container, in linea con
            il contenuto centrato della hero — non con logo/CTA che hanno
            larghezze diverse (giustify-between li avrebbe sbilanciata). */}
        <div className="flex flex-1 items-center">
          <Logo />
        </div>

        <nav aria-label="Navigazione principale" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Button
            href={donazioniUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            className="hidden md:inline-flex"
          >
            Dona
          </Button>
          <MobileMenu nav={nav} donazioniUrl={donazioniUrl} />
        </div>
      </div>
    </header>
  );
}
