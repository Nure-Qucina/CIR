import { getTranslations } from "next-intl/server";
import { Heart, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonClassName } from "@/components/ui/Button";
import { GeometricPattern } from "@/components/ui/GeometricPattern";
import { DONATION_ROUTE } from "@/lib/donazioni/config";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Banner donazioni (sezione G): CTA "Dona ora" → pagina interna /donazioni.
 */
export async function DonateBanner({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  return (
    <Container className="py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-3xl border border-orange-200 bg-orange-50 p-8 sm:p-12">
        <div
          aria-hidden
          className="text-orange pointer-events-none absolute inset-0 opacity-[0.07]"
        >
          <GeometricPattern size={72} id="donate-girih" />
        </div>
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <span className="bg-orange/15 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-orange-800">
              <Heart size={15} aria-hidden />
              {t("sostieniIlCir")}
            </span>
            <h2 className="text-ink mt-3 text-[length:var(--text-h2)] font-bold text-balance">
              {t("donaTitolo")}
            </h2>
            <p className="text-ink-soft mt-3">{t("donaSottotitolo")}</p>
          </div>
          <Link
            href={DONATION_ROUTE}
            locale={locale}
            className={buttonClassName({ size: "lg", className: "shrink-0" })}
          >
            {t("donaOra")}
            <ArrowRight size={18} className="rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </div>
    </Container>
  );
}
