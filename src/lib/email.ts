/**
 * Email client using Resend — server-side only.
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

const FROM_EMAIL = process.env.FROM_EMAIL ?? "Capturely <noreply@capturely.io>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

export async function sendPaymentFailedEmail(email: string, accountName: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Payment failed — Capturely",
    html: `
      <h2>Payment failed for ${accountName}</h2>
      <p>We were unable to process your payment. Please update your payment method within 7 days to avoid service interruption.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/app/billing">Update payment method</a></p>
    `,
  });
}

export async function sendAccountSuspendedEmail(email: string, accountName: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Account suspended — Capturely",
    html: `
      <h2>${accountName} has been suspended</h2>
      <p>Your grace period has expired. Your dashboard is locked until payment is resolved. Live forms continue to work.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/app/billing">Resolve billing</a></p>
    `,
  });
}

export async function sendPaymentResumedEmail(email: string, accountName: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Payment successful — Capturely",
    html: `
      <h2>Payment received for ${accountName}</h2>
      <p>Your payment has been processed. Full access has been restored.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/app/billing">View billing</a></p>
    `,
  });
}

export async function sendUsageWarningEmail(
  email: string,
  accountName: string,
  currentCount: number,
  limit: number
): Promise<void> {
  await sendEmail({
    to: email,
    subject: "Approaching submission limit — Capturely",
    html: `
      <h2>Usage warning for ${accountName}</h2>
      <p>You've used ${currentCount} of ${limit} submissions this billing cycle.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/app/billing">Upgrade your plan</a></p>
    `,
  });
}

export async function sendExperimentCompletedEmail(
  email: string,
  campaignName: string,
  winnerName: string,
  lift: number
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Experiment completed: ${campaignName} — Capturely`,
    html: `
      <h2>Winner found for ${campaignName}</h2>
      <p><strong>${winnerName}</strong> won with a <strong>+${lift.toFixed(1)}%</strong> conversion lift.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/app/campaigns">View results</a></p>
    `,
  });
}
