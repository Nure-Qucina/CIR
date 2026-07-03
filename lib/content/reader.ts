import "server-only";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "@/keystatic.config";

// [DIAG-TEMP] Logging diagnostico temporaneo — incident response runtime ISR.
// Vedi REPORT-FORENSE-FRONTEND-DATA-PIPELINE.md. Da rimuovere a diagnosi conclusa.
// Nessuna modifica di logica: solo osservazione dello stato del filesystem
// nel momento in cui questo modulo viene caricato dal runtime Node.
(() => {
  const cwd = process.cwd();
  const contentDir = path.join(cwd, "content");
  const eventiDir = path.join(contentDir, "eventi");
  const articoliDir = path.join(contentDir, "articoli");
  const publicDir = path.join(cwd, "public");
  const appDir = path.join(cwd, "app");

  console.log(
    "[DIAG-TEMP][reader-init][cwd]",
    JSON.stringify({
      timestamp: new Date().toISOString(),
      cwd,
      contentDir,
      publicDir,
      appDir,
      pid: process.pid,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
    }),
  );

  const contentExists = existsSync(contentDir);
  const eventiExists = existsSync(eventiDir);
  const articoliExists = existsSync(articoliDir);

  console.log(
    "[DIAG-TEMP][reader-init][existsSync]",
    JSON.stringify({ contentExists, eventiExists, articoliExists }),
  );

  if (contentExists) {
    try {
      const contentList = readdirSync(contentDir);
      console.log(
        "[DIAG-TEMP][reader-init][readdir-content]",
        JSON.stringify({ count: contentList.length, entries: contentList }),
      );
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      console.error(
        "[DIAG-TEMP][reader-init][EXCEPTION-readdir-content]",
        JSON.stringify({
          message: e?.message,
          stack: e?.stack,
          code: e?.code,
          errno: e?.errno,
          path: e?.path,
          syscall: e?.syscall,
        }),
      );
    }
  }

  if (eventiExists) {
    try {
      const eventiList = readdirSync(eventiDir);
      console.log(
        "[DIAG-TEMP][reader-init][readdir-eventi]",
        JSON.stringify({ count: eventiList.length, entries: eventiList }),
      );
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      console.error(
        "[DIAG-TEMP][reader-init][EXCEPTION-readdir-eventi]",
        JSON.stringify({
          message: e?.message,
          stack: e?.stack,
          code: e?.code,
          errno: e?.errno,
          path: e?.path,
          syscall: e?.syscall,
        }),
      );
    }
  }

  if (articoliExists) {
    try {
      const articoliList = readdirSync(articoliDir);
      console.log(
        "[DIAG-TEMP][reader-init][readdir-articoli]",
        JSON.stringify({ count: articoliList.length, entries: articoliList }),
      );
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      console.error(
        "[DIAG-TEMP][reader-init][EXCEPTION-readdir-articoli]",
        JSON.stringify({
          message: e?.message,
          stack: e?.stack,
          code: e?.code,
          errno: e?.errno,
          path: e?.path,
          syscall: e?.syscall,
        }),
      );
    }
  }
})();

/**
 * Reader Keystatic — unica porta d'accesso ai contenuti del repo.
 * I getter tipizzati (eventi.ts, articoli.ts, …) lo incapsulano: le pagine
 * non leggono mai i file direttamente (regola d'oro §3).
 */
export const reader = createReader(process.cwd(), keystaticConfig);
