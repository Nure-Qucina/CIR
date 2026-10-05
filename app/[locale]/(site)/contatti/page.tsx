import type { Metadata } from "next";
import { Mail, Phone, MapPin, Info } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/contatti/ContactForm";
import { FacebookIcon, InstagramIcon } from "@/components/ui/SocialIcons";
import { getSiteConfig } from "@/lib/content/site";
import { routing, type Locale } from "@/i18n/routing";
import { buildAlternates, buildOgLocale } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Contatti",
    description:
      "Scrivi alla Comunità Islamica di Roma. Per giornalisti, istituzioni e cittadini: dialogo, collaborazioni e richieste di informazioni.",
    alternates: buildAlternates("/contatti", locale as Locale),
    openGraph: buildOgLocale(locale as Locale),
  };
}

export default async function ContattiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const [t, tc, site] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "contatti" }),
    getTranslations({ locale: locale as Locale, namespace: "common" }),
    getSiteConfig(),
  ]);
  const { contatti } = site;

  return (
    <main id="contenuto">
      <PageHeader
        occhiello={t("occhiello")}
        titolo={t("titolo")}
        sottotitolo={t("sottotitolo")}
        crumbs={[{ label: tc("home"), href: "/" }, { label: t("titolo") }]}
        illustrazione="busta"
      />

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          {/* Form */}
          <div>
            <h2 className="text-ink text-[length:var(--text-h3)] font-bold">
              {t("scriviciUnMessaggio")}
            </h2>
            <p className="text-ink-soft mt-2">{t("compilaIlModulo")}</p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>

          {/* Info istituzionali */}
          <aside className="space-y-6">
            <div className="foglio p-6">
              <h2 className="text-ink text-lg font-bold">{t("recapiti")}</h2>

              {contatti.placeholder ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm">
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-orange-700"
                    aria-hidden
                  />
                  <p className="text-ink">{t("recapitiPlaceholder")}</p>
                </div>
              ) : (
                <ul className="mt-4 space-y-4 text-sm">
                  {contatti.email && (
                    <li className="flex gap-3">
                      <Mail
                        size={18}
                        className="text-teal mt-0.5 shrink-0"
                        aria-hidden
                      />
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
                      <Phone
                        size={18}
                        className="text-teal mt-0.5 shrink-0"
                        aria-hidden
                      />
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
                      <MapPin
                        size={18}
                        className="text-teal mt-0.5 shrink-0"
                        aria-hidden
                      />
                      <span className="text-ink">{contatti.indirizzo}</span>
                    </li>
                  )}
                </ul>
              )}
            </div>

            <div className="foglio p-6">
              <h2 className="text-ink text-lg font-bold">{t("seguici")}</h2>
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
                      className="bg-teal text-cream hover:bg-teal-dark grid h-11 w-11 place-items-center rounded-lg transition-colors"
                    >
                      <Icon size={20} />
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="carta-teal rotate-[0.6deg] rounded-md p-6 shadow-[0_16px_32px_rgb(20_30_28/0.28)]">
              <h2 className="text-lg font-bold">{t("seiGiornalista")}</h2>
              <p className="text-cream/85 mt-2 text-sm">
                {t("giornalistaBody")}
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
