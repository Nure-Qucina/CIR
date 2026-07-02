import { Montserrat, Source_Serif_4 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotFoundContent } from "@/components/NotFoundContent";
import messages from "@/messages/it.json";
import "./globals.css";

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
 * 404 di ultimo livello (root, fuori da app/[locale]): scatta solo per URL
 * che non intercettano nessun segmento noto (edge case molto raro, dato che
 * il middleware instrada quasi tutto dentro [locale]). Root layout
 * indipendente: html/font/globals.css propri, lingua italiana di default.
 */
export default function GlobalNotFound() {
  return (
    <html lang="it" className={`${montserrat.variable} ${sourceSerif.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        {/* Provider locale con catalogo IT: Header/Footer includono
            MobileMenu/LanguageSwitcher (Client Component, useTranslations),
            che qui non erediterebbero altrimenti alcun contesto next-intl
            (questa pagina vive fuori da app/[locale]). */}
        <NextIntlClientProvider locale="it" messages={messages}>
          <Header locale="it" />
          <NotFoundContent />
          <Footer locale="it" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
