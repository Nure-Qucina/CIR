import { ImageResponse } from "next/og";
import { loadGoogleFont } from "./loadGoogleFont";
import type { Locale } from "@/i18n/routing";

// Dimensioni standard Open Graph.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const CREAM = "#F8EFE3";
const ORANGE = "#EC8B36";
const TEAL = "#5F746E";
const INK = "#2A1F0E";
const INK_SOFT = "#5A4F3E";

const SCRIPT_FONT: Partial<Record<Locale, string>> = {
  ar: "Noto Naskh Arabic",
  bn: "Noto Sans Bengali",
};

/**
 * Template OG on-brand (crema + barra teal + accento arancione).
 * `occhiello` = categoria/contesto, `titolo` = headline, `meta` = data/luogo.
 * `locale`: per ar/bn scarica il font dello script (Satori/next-og non legge
 * i font caricati via next/font — servono i bytes TTF, vedi loadGoogleFont)
 * limitato ai soli caratteri usati nell'immagine (§9 brief i18n).
 */
export async function renderOg({
  occhiello,
  titolo,
  meta,
  footer = "Comunità Islamica di Roma",
  locale = "it",
}: {
  occhiello?: string;
  titolo: string;
  meta?: string;
  footer?: string;
  locale?: Locale;
}) {
  const googleFontName = SCRIPT_FONT[locale];
  const fonts = googleFontName
    ? await (async () => {
        const text = [occhiello, titolo, meta, footer]
          .filter(Boolean)
          .join(" ");
        const data = await loadGoogleFont(googleFontName, text);
        return [
          { name: googleFontName, data, style: "normal" as const, weight: 400 as const },
          { name: googleFontName, data, style: "normal" as const, weight: 700 as const },
        ];
      })()
    : [];
  const fontFamily = googleFontName ?? "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: CREAM,
          fontFamily,
        }}
      >
        {/* Barra laterale teal con sigla */}
        <div
          style={{
            width: 200,
            background: TEAL,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: CREAM,
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          CIR
        </div>

        {/* Contenuto */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "64px 72px",
          }}
        >
          {occhiello ? (
            <div
              style={{
                display: "flex",
                color: ORANGE,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              {occhiello}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              color: INK,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {titolo}
          </div>

          {meta ? (
            <div
              style={{
                display: "flex",
                color: INK_SOFT,
                fontSize: 30,
                marginTop: 28,
              }}
            >
              {meta}
            </div>
          ) : null}

          {/* Accento arancione */}
          <div
            style={{
              display: "flex",
              width: 120,
              height: 8,
              background: ORANGE,
              borderRadius: 4,
              marginTop: 40,
            }}
          />

          <div
            style={{
              display: "flex",
              color: INK_SOFT,
              fontSize: 24,
              marginTop: 28,
            }}
          >
            {footer}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
