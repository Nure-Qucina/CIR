import { Heart, Users, HandHeart, MessagesSquare } from "lucide-react";
import type { Valore } from "@/lib/data/cir";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

const ICONE = {
  heart: Heart,
  users: Users,
  "hand-helping": HandHeart,
  "messages-square": MessagesSquare,
} as const;

/** Card valore: icona + titolo + testo. Accent teal/arancione alternato. */
export function ValueCard({
  valore,
  index,
}: {
  valore: Valore;
  index: number;
}) {
  const Icon = ICONE[valore.icona];
  const orange = index % 2 === 1;

  return (
    <Card className="flex h-full flex-col p-6">
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-xl",
          orange ? "bg-orange-100 text-orange-700" : "bg-teal-100 text-teal-700",
        )}
      >
        <Icon size={24} aria-hidden />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{valore.titolo}</h3>
      <p className="mt-2 text-ink-soft">{valore.testo}</p>
    </Card>
  );
}
