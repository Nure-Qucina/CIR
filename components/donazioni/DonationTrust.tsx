import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

export function DonationTrust() {
  const t = useTranslations("donazioni");
  const items = [
    { Icon: ShieldCheck, label: t("trustStripe") },
    { Icon: CreditCard, label: t("trustCard") },
    { Icon: Lock, label: t("trustConnection") },
  ] as const;

  return (
    <ul className="mt-4 grid gap-2 sm:grid-cols-3">
      {items.map(({ Icon, label }) => (
        <li
          key={label}
          className="text-ink-soft flex items-start gap-2 text-xs leading-snug"
        >
          <Icon className="text-teal mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
