import { cn } from "@/lib/utils/cn";

/**
 * Prose — stile tipografico per il corpo degli articoli (MDX).
 * Corpo in serif (Source Serif 4) per una lettura comoda; titoli e link
 * coerenti col brand. Niente plugin: regole esplicite, controllo totale.
 */
export function Prose({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-none font-serif text-lg leading-relaxed text-ink",
        // titoli
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-sans [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink",
        "[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:font-sans [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink",
        // paragrafi e liste
        "[&_p]:my-5",
        "[&_ul]:my-5 [&_ul]:list-disc [&_ul]:ps-6 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:ps-6",
        "[&_li]:my-1.5",
        // link
        "[&_a]:font-medium [&_a]:text-teal-700 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-teal",
        // citazioni
        "[&_blockquote]:my-6 [&_blockquote]:border-s-4 [&_blockquote]:border-orange [&_blockquote]:bg-cream-50 [&_blockquote]:py-2 [&_blockquote]:ps-5 [&_blockquote]:text-ink-soft [&_blockquote]:italic",
        // enfasi e codice
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_hr]:my-10 [&_hr]:border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}
