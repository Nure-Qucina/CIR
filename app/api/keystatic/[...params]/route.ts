import { makeRouteHandler } from "@keystatic/next/route-handler";
import keystaticConfig from "@/keystatic.config";

// API route che serve l'editing Keystatic (lettura/scrittura file in local mode,
// OAuth GitHub in github mode).
export const { POST, GET } = makeRouteHandler({
  config: keystaticConfig,
});
