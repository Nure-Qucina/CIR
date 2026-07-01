import KeystaticApp from "./keystatic";

// L'admin Keystatic ha la sua UI completa: bypassa header/footer del sito
// renderizzando da qui (segmento isolato).
export default function RootLayout() {
  return <KeystaticApp />;
}
