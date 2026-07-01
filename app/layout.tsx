import type { Metadata } from "next";
import { Montserrat, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Font del brand — self-hosted via next/font, preload + display swap.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Serif opzionale per il corpo degli articoli long-form (lettura più comoda).
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${montserrat.variable} ${sourceSerif.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
