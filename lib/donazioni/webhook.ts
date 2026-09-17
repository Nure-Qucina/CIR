import "server-only";
import Stripe from "stripe";
import {
  donationFrequencyFromMetadata,
  isCirDonationPurpose,
} from "./metadata";
import { sendDonationThankYouEmail } from "./email";
import type { DonationFrequency } from "./config";
import {
  parseMetadataCents,
  shouldSendInitialThankYou,
  thankYouIdempotencyKey,
} from "./status-state";

function sessionEmail(session: Stripe.Checkout.Session): string | null {
  const fromSession = session.customer_email?.trim();
  if (fromSession) return fromSession;
  const fromDetails = session.customer_details?.email?.trim();
  return fromDetails || null;
}

function sessionAmountCents(session: Stripe.Checkout.Session): number | null {
  if (
    typeof session.amount_total === "number" &&
    Number.isInteger(session.amount_total) &&
    session.amount_total >= 0
  ) {
    return session.amount_total;
  }
  return null;
}

function logDonationWebhook(event: Stripe.Event, note: string): void {
  console.info("donation_webhook", { id: event.id, type: event.type, note });
}

async function sendThankYouIfEligible(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (!isCirDonationPurpose(session.metadata)) return;
  if (!shouldSendInitialThankYou(event.type, session.payment_status)) return;
  if (!session.id) return;

  const frequency: DonationFrequency | null = donationFrequencyFromMetadata(
    session.metadata,
    session.mode,
  );
  const email = sessionEmail(session);
  const firstName = session.metadata?.donor_first_name?.trim();
  const totalCents = sessionAmountCents(session);
  const locale = session.metadata?.locale ?? "it";
  if (!frequency || !email || !firstName || totalCents === null) return;

  const donationCents =
    parseMetadataCents(session.metadata?.base_donation_amount_cents) ??
    totalCents;
  const contributionCents =
    parseMetadataCents(session.metadata?.processing_cost_contribution_cents) ??
    0;

  const emailStatus = await sendDonationThankYouEmail({
    eventId: thankYouIdempotencyKey(session.id),
    email,
    firstName,
    donationCents,
    contributionCents,
    totalCents,
    locale,
    frequency,
  });
  logDonationWebhook(event, `email_${emailStatus}`);
}

/**
 * Side-effect persistente: email di ringraziamento iniziale dopo successo
 * verificato (carta immediata o SEPA async). Idempotenza Resend = session id,
 * così completed e async_payment_succeeded non duplicano. Resend failure
 * non altera lo stato della donazione. invoice.paid non invia email custom.
 */
export async function handleDonationWebhookEvent(
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      await sendThankYouIfEligible(
        event,
        event.data.object as Stripe.Checkout.Session,
      );
      return;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (!isCirDonationPurpose(session.metadata)) return;
      logDonationWebhook(event, "async_payment_failed");
      return;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      if (
        !isCirDonationPurpose(invoice.parent?.subscription_details?.metadata)
      ) {
        return;
      }
      return;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (
        !isCirDonationPurpose(invoice.parent?.subscription_details?.metadata)
      ) {
        return;
      }
      logDonationWebhook(event, "payment_failed");
      return;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      if (!isCirDonationPurpose(subscription.metadata)) return;
      logDonationWebhook(event, "subscription_updated");
      return;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      if (!isCirDonationPurpose(subscription.metadata)) return;
      logDonationWebhook(event, "subscription_deleted");
      return;
    }
    default:
      return;
  }
}
