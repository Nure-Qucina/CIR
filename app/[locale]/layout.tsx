import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import {
  Montserrat,
  Source_Serif_4,
  Noto_Naskh_Arabic,
  Noto_Sans_Bengali,
} from "next/font/google";
import { routing, isRtl, type Locale } from "@/i18n/routing";
import "../globals.css";

/**
 * Root layout locale-aware: `<html lang dir>` dinamici, provider dei
 * messaggi per i Client Component, font del brand. Root layout "sotto un
 * dynamic segment" (pattern ufficiale Next.js per l'i18n): non c'è più un
 * app/layout.tsx condiviso, /keystatic ha la propria radice indipendente.
 *
 * `dynamic = "force-static"`: senza questo, next-intl (setRequestLocale +
 * getMessages) fa sì che l'intera sottoalbero venga marcato dinamico
 * dall'euristica 'auto' di Next 16 — anche con generateStaticParams
 * corretto — perdendo SSG/ISR. Forziamo lo static rendering esplicitamente
 * (sicuro: nessuna pagina qui dipende da cookies/headers/searchParams reali).
 */
export const dynamic = "force-static";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

/**
 * Font per script arabo/bengalese (Montserrat/Source Serif non li coprono).
 * `--font-arabic`/`--font-bengali` entrano in `<html className>` solo sulla
 * variante statica del locale corrispondente (vedi sotto). `preload: false`:
 * next/font precarica ogni font dichiarato in questo layout su OGNI pagina
 * (indipendentemente da quale locale la usi davvero, perché la chiamata al
 * loader è condivisa), quindi senza disattivarlo le pagine IT/EN
 * scaricherebbero comunque in anticipo i font arabo/bengalese — l'opposto
 * di "preload della sola lingua corrente" (§8 brief i18n).
 */
const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Comunità Islamica di Roma",
    template: "%s · Comunità Islamica di Roma",
  },
  description:
    "La Comunità Islamica di Roma (CIR) dà voce ai musulmani della capitale: 22 associazioni unite per diritti, dialogo e una città più giusta.",
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Comunità Islamica di Roma",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Static rendering: fissa la lingua per questa request (richiesto da
  // next-intl per mantenere SSG/ISR invece di forzare rendering dinamico).
  setRequestLocale(locale);

  const dir = isRtl(locale) ? "rtl" : "ltr";
  // Locale esplicito: sotto `force-static` il rilevamento automatico via
  // requestLocale/headers() di next-intl non è affidabile in fase di SSG
  // (vedi commento sopra su `force-static`) — passiamo sempre `locale` a mano.
  const messages = await getMessages({ locale: locale as Locale });

  // Font dello script: solo quello del locale corrente entra nel bundle di
  // questa pagina statica (§8 brief i18n — niente preload delle altre lingue).
  // Montserrat/Source Serif servono solo a IT/EN: per ar/bn `--font-sans` e
  // `--font-serif` vengono ridefiniti su Noto Naskh Arabic/Sans Bengali
  // (vedi globals.css), quindi qui non li includiamo nemmeno.
  const fontVariables =
    locale === "ar"
      ? notoNaskhArabic.variable
      : locale === "bn"
        ? notoSansBengali.variable
        : `${montserrat.variable} ${sourceSerif.variable}`;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontVariables} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <NextIntlClientProvider locale={locale as Locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
