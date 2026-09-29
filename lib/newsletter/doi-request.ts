import { BREVO_DOI_ENDPOINT, type BrevoDoiConfig } from "./config";

export type NewsletterDoubleOptInInput = {
  email: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
};

export function buildBrevoDoubleOptInRequest(
  config: BrevoDoiConfig,
  input: NewsletterDoubleOptInInput,
): {
  url: typeof BREVO_DOI_ENDPOINT;
  method: "POST";
  headers: {
    accept: "application/json";
    "content-type": "application/json";
    "api-key": string;
  };
  body: {
    email: string;
    includeListIds: number[];
    templateId: number;
    redirectionUrl: string;
  };
} {
  return {
    url: BREVO_DOI_ENDPOINT,
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": config.apiKey,
    },
    body: {
      email: input.email,
      includeListIds: [config.listId],
      templateId: config.templateId,
      redirectionUrl: config.redirectUrl,
    },
  };
}

export function safeBrevoErrorDetails(
  body: unknown,
  privateValues: (string | undefined)[],
): { code?: string; message?: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const record = body as Record<string, unknown>;
  const sensitiveValues = privateValues.filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  const candidateCode = record.code;
  let code: string | undefined;
  if (
    typeof candidateCode === "string" &&
    /^[a-z][a-z0-9_]{0,63}$/i.test(candidateCode) &&
    !sensitiveValues.some((value) =>
      candidateCode.toLowerCase().includes(value.toLowerCase()),
    )
  ) {
    code = candidateCode;
  }

  if (typeof record.message !== "string") return code ? { code } : {};

  let message = record.message.slice(0, 1000);
  for (const value of sensitiveValues) {
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    message = message.replace(new RegExp(escaped, "gi"), "[redacted]");
  }
  message = message
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\b(?:https?:\/\/|www\.)[^\s"'<>]+/gi, "[redacted-url]")
    .replace(/\bxkeysib-[A-Za-z0-9_-]+\b/gi, "[redacted-secret]")
    .replace(
      /\b(?:api[-_ ]?key|authorization|bearer|token|secret|password)\s*[:=]\s*["']?[^\s"'&,;]+/gi,
      "[redacted-secret]",
    )
    .replace(/\b[A-Za-z0-9_=-]{32,}\b/g, "[redacted-secret]")
    .slice(0, 300);

  return { ...(code ? { code } : {}), ...(message ? { message } : {}) };
}
