import type { Metadata } from "next";
import "../globals.css";

/**
 * Root layout minimale per gli strumenti di redazione (/admin/*).
 * Fuori da app/[locale] come /keystatic: non localizzato, non indicizzato
 * (robots.ts lo esclude, qui anche il meta per sicurezza).
 */
export const metadata: Metadata = {
  title: "Strumenti redazione — CIR",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
