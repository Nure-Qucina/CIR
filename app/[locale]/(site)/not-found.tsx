import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { Button } from "@/components/ui/Button";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";

/**
 * 404 per le rotte interne al gruppo (site): eredita header/footer dal layout,
 * localizzato. Markup duplicato da components/NotFoundContent.tsx apposta —
 * quel componente resta hardcoded IT perché serve anche al fallback globale
 * fuori da [locale] (app/not-found.tsx), dove non esiste contesto lingua.
 *
 * `not-found.js` non riceve `params` (vincolo di Next.js): la lingua va letta
 * dall'header impostato dal proxy/middleware next-intl (X-NEXT-INTL-LOCALE).
 */
export default async function NotFound() {
  const requested = (await headers()).get("x-next-intl-locale");
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <main
      id="contenuto"
      className="relative flex flex-1 items-center overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 text-teal opacity-[0.05]">
        <GeometricPattern size={90} id="nf-girih" />
      </div>
      <Container className="relative py-24 text-center">
        <p className="text-sm font-semibold tracking-[0.2em] text-orange uppercase">
          {t("errore404")}
        </p>
        <h1 className="mt-3 text-[length:var(--text-h1)] font-bold text-ink">
          {t("titolo")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-soft">
          {t("body")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">{t("tornaAllaHome")}</Button>
          <Button href="/news" variant="ghost">
            {t("vaiAlleNews")}
          </Button>
        </div>
      </Container>
    </main>
  );
}
