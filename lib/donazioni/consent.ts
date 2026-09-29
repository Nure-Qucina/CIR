import type { Locale } from "@/i18n/routing";

export const NEWSLETTER_CONSENT_SOURCE = "donation_form";
export const NEWSLETTER_CONSENT_COPY_VERSION = "donation-newsletter-v1";
export const NEWSLETTER_CONSENT_FIELD_NAME = "newsletter-consent";

export function shouldRenderNewsletterConsent(enabled: boolean): boolean {
  return enabled === true;
}

/** The optional checkbox is never preselected, even when the flag is on. */
export function newsletterConsentFieldState(enabled: boolean): {
  present: boolean;
  checked: boolean;
} {
  return {
    present: shouldRenderNewsletterConsent(enabled),
    checked: false,
  };
}

/** Client/server: consent is recorded only when the feature flag is on. */
export function newsletterConsentForCheckout(
  enabled: boolean,
  checked: boolean,
): boolean {
  return enabled === true && checked === true;
}

export type NewsletterConsentEvidence = {
  newsletter_consent: "true" | "false";
  newsletter_consent_at: string;
  newsletter_consent_source: typeof NEWSLETTER_CONSENT_SOURCE;
  newsletter_consent_locale: Locale;
  newsletter_consent_copy: typeof NEWSLETTER_CONSENT_COPY_VERSION;
};

/**
 * Consent evidence stored on Stripe Checkout Session / subscription metadata.
 * Does not subscribe the donor to a list. Values are strings because Stripe
 * metadata is string-only. No donor PII beyond locale.
 */
export function newsletterConsentMetadata(input: {
  consent: boolean;
  locale: Locale;
  at?: Date;
}): NewsletterConsentEvidence {
  return {
    newsletter_consent: input.consent ? "true" : "false",
    newsletter_consent_at: (input.at ?? new Date()).toISOString(),
    newsletter_consent_source: NEWSLETTER_CONSENT_SOURCE,
    newsletter_consent_locale: input.locale,
    newsletter_consent_copy: NEWSLETTER_CONSENT_COPY_VERSION,
  };
}
