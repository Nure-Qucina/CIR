import { NotFoundContent } from "@/components/NotFoundContent";

// 404 per le rotte interne al gruppo (site): eredita header/footer dal layout.
export default function NotFound() {
  return <NotFoundContent />;
}
