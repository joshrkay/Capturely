import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { StripeConfigurationError, verifyWebhookSignature } from "@/lib/stripe";
import { sendPaymentFailedEmail, sendAccountSuspendedEmail } from "@/lib/email";
import Stripe from "stripe";

/** POST /api/stripe/webhook — Handle Stripe webhook events */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await verifyWebhookSignature(body, signature);
  } catch (err) {
    if (err instanceof StripeConfigurationError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.processedStripeEvent.findUnique({
    where: { eventId: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await prisma.processedStripeEvent.create({
    data: { eventId: event.id },
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = session.metadata?.accountId;
      const planKey = session.metadata?.planKey;
      if (accountId && planKey) {
        await prisma.account.update({
          where: { id: accountId },
          data: {
            planKey,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            paymentStatus: "active",
            billingCycleStart: new Date(),
            billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Reset usage counters on new subscription
        await prisma.accountUsage.upsert({
          where: { accountId },
          create: { accountId, submissionCount: 0, overageCount: 0, aiGenerationsCount: 0, usageLocked: false },
          update: { submissionCount: 0, overageCount: 0, aiGenerationsCount: 0, usageLocked: false },
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const account = await prisma.account.findFirst({
        where: { stripeCustomerId: sub.customer as string },
      });
      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            billingCycleStart: new Date((sub as unknown as { current_period_start: number }).current_period_start * 1000),
            billingCycleEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          },
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const account = await prisma.account.findFirst({
        where: { stripeCustomerId: sub.customer as string },
      });
      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: {
            planKey: "free",
            stripeSubscriptionId: null,
            paymentStatus: "active",
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const account = await prisma.account.findFirst({
        where: { stripeCustomerId: invoice.customer as string },
        include: { members: { where: { role: "owner" } } },
      });
      if (account) {
        const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await prisma.account.update({
          where: { id: account.id },
          data: {
            paymentStatus: "past_due",
            paymentGraceUntil: graceUntil,
          },
        });

        await prisma.notification.create({
          data: {
            accountId: account.id,
            type: "payment_failed",
            title: "Payment failed",
            body: "We couldn't process your payment. Please update your payment method within 7 days.",
            linkUrl: "/app/billing",
          },
        });

        const toEmail = await getAccountOwnerEmail(account.id);
        if (!toEmail) {
          console.error("[stripe webhook] payment failed: no owner email for account", { accountId: account.id });
        } else {
          try {
            await sendPaymentFailedEmail(toEmail, account.name);
          } catch {
            // Email sending is best-effort
          }
        }
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const account = await prisma.account.findFirst({
        where: { stripeCustomerId: invoice.customer as string },
        select: { id: true, paymentStatus: true, name: true },
      });
      if (!account) {
        break;
      }

      const wasSuspendedOrPastDue =
        account.paymentStatus === "past_due" || account.paymentStatus === "suspended";

      await prisma.account.update({
        where: { id: account.id },
        data: {
          paymentStatus: "active",
          paymentGraceUntil: null,
        },
      });

      // Reset usage on billing cycle renewal
      await prisma.accountUsage.upsert({
        where: { accountId: account.id },
        create: { accountId: account.id, submissionCount: 0, overageCount: 0, aiGenerationsCount: 0, usageLocked: false },
        update: { submissionCount: 0, overageCount: 0, aiGenerationsCount: 0, usageLocked: false },
      });

      if (wasSuspendedOrPastDue) {
        await prisma.notification.create({
          data: {
            accountId: account.id,
            type: "payment_resumed",
            title: "Payment successful",
            body: "Your payment has been processed. Full access has been restored.",
            linkUrl: "/app/billing",
          },
        });

        const resumedTo = await getAccountOwnerEmail(account.id);
        if (!resumedTo) {
          console.error("[stripe webhook] payment resumed: no owner email for account", { accountId: account.id });
        } else {
          try {
            await sendPaymentResumedEmail(resumedTo, account.name);
          } catch {
            // Email sending is best-effort
          }
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
