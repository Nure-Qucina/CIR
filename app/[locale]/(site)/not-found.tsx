import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import Image from "next/image";
import { ILLUSTRAZIONI } from "@/lib/carta";
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
      <Container className="relative py-20 text-center">
        {/* La mappa di Roma con lo spillo: "ti sei perso?" */}
        <Image
          src={ILLUSTRAZIONI.mappa.src}
          width={ILLUSTRAZIONI.mappa.width}
          height={ILLUSTRAZIONI.mappa.height}
          alt=""
          sizes="320px"
          className="ritaglio mx-auto mb-8 h-auto w-64 -rotate-[3deg] sm:w-80"
        />
        <p className="text-orange text-sm font-semibold tracking-[0.2em] uppercase">
          {t("errore404")}
        </p>
        <h1 className="text-ink mt-3 text-[length:var(--text-h1)] font-bold">
          {t("titolo")}
        </h1>
        <p className="text-ink-soft mx-auto mt-4 max-w-md text-lg">
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
