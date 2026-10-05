import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClassName } from "@/components/ui/Button";
import { DONATION_ROUTE } from "@/lib/donazioni/config";
import { ILLUSTRAZIONI } from "@/lib/carta";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Banner donazioni (sezione G): foglio di carta con il germoglio nel vaso che
 * esce dal bordo. CTA "Dona ora" → pagina interna /donazioni.
 */
export async function DonateBanner({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const { germoglio } = ILLUSTRAZIONI;
  return (
    <Container className="pt-28 pb-16 sm:pb-20 lg:pt-32">
      <div className="foglio relative px-6 pt-36 pb-8 text-center sm:px-10 lg:grid lg:grid-cols-[220px_1fr_auto] lg:items-center lg:gap-10 lg:py-10 lg:text-start">
        <Image
          src={germoglio.src}
          width={germoglio.width}
          height={germoglio.height}
          alt=""
          sizes="(max-width: 1024px) 170px, 220px"
          className="ritaglio absolute start-1/2 -top-20 h-auto w-[170px] -translate-x-1/2 lg:static lg:-my-24 lg:w-full lg:translate-x-0 rtl:translate-x-1/2 rtl:lg:translate-x-0"
        />
        <div className="mx-auto max-w-xl lg:mx-0">
          <p className="text-sm font-semibold tracking-[0.2em] text-orange-700 uppercase">
            {t("sostieniIlCir")}
          </p>
          <h2 className="text-ink mt-3 text-[length:var(--text-h2)] font-bold text-balance">
            {t("donaTitolo")}
          </h2>
          <p className="text-ink-soft mt-3">{t("donaSottotitolo")}</p>
        </div>
        <Link
          href={DONATION_ROUTE}
          locale={locale}
          className={buttonClassName({
            size: "lg",
            className: "mt-6 shrink-0 lg:mt-0",
          })}
        >
          {t("donaOra")}
          <ArrowRight size={18} className="rtl:rotate-180" aria-hidden />
        </Link>
      </div>
    </Container>
  );
}
