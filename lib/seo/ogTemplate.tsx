import { ImageResponse } from "next/og";

// Dimensioni standard Open Graph.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const CREAM = "#F8EFE3";
const ORANGE = "#EC8B36";
const TEAL = "#5F746E";
const INK = "#2A1F0E";
const INK_SOFT = "#5A4F3E";

/**
 * Template OG on-brand (crema + barra teal + accento arancione).
 * `occhiello` = categoria/contesto, `titolo` = headline, `meta` = data/luogo.
 */
export function renderOg({
  occhiello,
  titolo,
  meta,
}: {
  occhiello?: string;
  titolo: string;
  meta?: string;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: CREAM,
          fontFamily: "sans-serif",
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
            Comunità Islamica di Roma
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
