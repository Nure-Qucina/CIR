import "server-only";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";

/**
 * Reader Keystatic — unica porta d'accesso ai contenuti del repo.
 * I getter tipizzati (eventi.ts, articoli.ts, …) lo incapsulano: le pagine
 * non leggono mai i file direttamente (regola d'oro §3).
 */
export const reader = createReader(process.cwd(), keystaticConfig);
