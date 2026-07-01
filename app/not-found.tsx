import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotFoundContent } from "@/components/NotFoundContent";

// 404 globale (rotte sconosciute): il root layout è minimale, quindi includiamo
// header e footer qui per mantenere la cornice del sito.
export default function GlobalNotFound() {
  return (
    <>
      <Header />
      <NotFoundContent />
      <Footer />
    </>
  );
}
