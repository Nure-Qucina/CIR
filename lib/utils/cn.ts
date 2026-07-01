import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classi condizionali (clsx) e risolve i conflitti Tailwind (twMerge).
 * Uso: cn("px-2", condizione && "px-4") → "px-4".
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
