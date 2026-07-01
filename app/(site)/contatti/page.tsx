import type { Metadata } from "next";
import { Mail, Phone, MapPin, Info } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/contatti/ContactForm";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";
import { getSiteConfig } from "@/lib/content/site";

export const metadata: Metadata = {
  title: "Contatti",
  description:
    "Scrivi alla Comunità Islamica di Roma. Per giornalisti, istituzioni e cittadini: dialogo, collaborazioni e richieste di informazioni.",
};

export default async function ContattiPage() {
  const site = await getSiteConfig();
  const { contatti } = site;

  return (
    <main id="contenuto">
      <PageHeader
        occhiello="Parliamone"
        titolo="Contatti"
        sottotitolo="Per giornalisti, istituzioni e cittadini: siamo un interlocutore aperto al dialogo. Scrivici, ti risponderemo."
        crumbs={[{ label: "Home", href: "/" }, { label: "Contatti" }]}
      />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          {/* Form */}
          <div>
            <h2 className="text-[length:var(--text-h3)] font-bold text-ink">
              Scrivici un messaggio
            </h2>
            <p className="mt-2 text-ink-soft">
              Compila il modulo: i campi sono tutti obbligatori.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          {/* Info istituzionali */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="text-lg font-bold text-ink">Recapiti</h2>

              {contatti.placeholder ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-orange-700"
                    aria-hidden
                  />
                  <p className="text-ink">
                    Email, telefono e indirizzo della sede saranno pubblicati a
                    breve. Nel frattempo puoi raggiungerci tramite il modulo o
                    sui canali social.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-4 text-sm">
                  {contatti.email && (
                    <li className="flex gap-3">
                      <Mail size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                      <a
                        href={`mailto:${contatti.email}`}
                        className="text-ink underline-offset-4 hover:underline"
                      >
                        {contatti.email}
                      </a>
                    </li>
                  )}
                  {contatti.telefono && (
                    <li className="flex gap-3">
                      <Phone size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                      <a
                        href={`tel:${contatti.telefono.replace(/\s/g, "")}`}
                        className="text-ink underline-offset-4 hover:underline"
                      >
                        {contatti.telefono}
                      </a>
                    </li>
                  )}
                  {contatti.indirizzo && (
                    <li className="flex gap-3">
                      <MapPin size={18} className="mt-0.5 shrink-0 text-teal" aria-hidden />
                      <span className="text-ink">{contatti.indirizzo}</span>
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-cream-50 p-6">
              <h2 className="text-lg font-bold text-ink">Seguici</h2>
              <div className="mt-4 flex gap-3">
                {site.social.map((s) => {
                  const Icon =
                    s.piattaforma === "facebook" ? FacebookIcon : InstagramIcon;
                  return (
                    <a
                      key={s.piattaforma}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.piattaforma}
                      className="grid h-11 w-11 place-items-center rounded-lg bg-teal text-cream transition-colors hover:bg-teal-dark"
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-teal p-6 text-cream">
              <h2 className="text-lg font-bold">Sei un* giornalista?</h2>
              <p className="mt-2 text-sm text-cream/85">
                Il CIR si offre come interlocutore per contestualizzare notizie,
                contatti con i portavoce, dati e materiali, e partecipazione a
                dibattiti.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
