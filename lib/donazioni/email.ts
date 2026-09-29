import "server-only";
import { Resend } from "resend";
import { getCustomerPortalLoginUrl, type DonationFrequency } from "./config";
import {
  formatDonationFromAddress,
  renderDonationThankYouEmail,
} from "./email-render";

export async function sendDonationThankYouEmail(input: {
  eventId: string;
  email: string;
  firstName: string;
  donationCents: number;
  contributionCents: number;
  totalCents: number;
  locale: string;
  frequency: DonationFrequency;
}): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return "skipped";

  const rendered = renderDonationThankYouEmail({
    firstName: input.firstName,
    donationCents: input.donationCents,
    contributionCents: input.contributionCents,
    totalCents: input.totalCents,
    locale: input.locale,
    frequency: input.frequency,
    portalUrl: getCustomerPortalLoginUrl()?.toString() ?? null,
  });

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send(
      {
        from: formatDonationFromAddress(),
        to: input.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      },
      { idempotencyKey: input.eventId },
    );
    if (error) return "failed";
    return "sent";
  } catch {
    return "failed";
  }
}
