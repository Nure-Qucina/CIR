import { BREVO_DOI_ENDPOINT, type BrevoDoiConfig } from "./config";

export type NewsletterDoubleOptInInput = {
  email: string;
  firstName: string;
  lastName: string;
  locale: string;
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
    attributes: { FIRSTNAME: string; LASTNAME: string };
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
      attributes: {
        FIRSTNAME: input.firstName,
        LASTNAME: input.lastName,
      },
      includeListIds: [config.listId],
      templateId: config.templateId,
      redirectionUrl: config.redirectUrl,
    },
  };
}
