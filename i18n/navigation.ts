import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Wrapper locale-aware di Link/redirect/usePathname/useRouter/getPathname.
 * Da usare al posto degli equivalenti di next/link e next/navigation in
 * tutti i componenti che navigano internamente, così l'URL include sempre
 * il prefisso di lingua corretto (o nessuno, per l'italiano).
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
