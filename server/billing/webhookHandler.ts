import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import type { Request, Response } from "express";
import { storage } from "../storage";
import { log } from "../vite";

export async function handlePolarWebhook(req: Request, res: Response): Promise<void> {
  const secret = process.env.POLAR_WEBHOOK_SECRET ?? "";

  let event: ReturnType<typeof validateEvent>;
  try {
    event = validateEvent(req.body as Buffer, req.headers as Record<string, string>, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      res.status(403).send("Invalid webhook signature");
      return;
    }
    log(`[billing] Webhook parse error: ${err instanceof Error ? err.message : String(err)}`);
    res.status(400).send("Bad request");
    return;
  }

  // Acknowledge immediately — Polar requires a response within 10 seconds
  res.status(202).send();

  // Process asynchronously so we don't block the response
  processEvent(event).catch((err) => {
    log(`[billing] Webhook processing error (${event.type}): ${err instanceof Error ? err.message : String(err)}`);
  });
}

async function resolveUserId(data: any): Promise<number | null> {
  // Primary: externalCustomerId set during checkout creation
  const externalId = data.customer?.externalId ?? data.externalCustomerId;
  if (externalId) {
    const parsed = parseInt(externalId, 10);
    if (!isNaN(parsed)) return parsed;
  }

  // Fallback: look up by stored Polar customer ID
  const polarCustomerId = data.customerId ?? data.customer?.id;
  if (polarCustomerId) {
    const user = await storage.getUserByPolarCustomerId(polarCustomerId);
    if (user) return user.id;
  }

  return null;
}

function resolvePlan(productId: string): string {
  if (productId === process.env.POLAR_PRO_PRODUCT_ID) return "pro";
  if (productId === process.env.POLAR_STARTER_PRODUCT_ID) return "starter";
  return "free";
}

async function processEvent(event: any): Promise<void> {
  const { type, data } = event;
  log(`[billing] Processing event: ${type}`);

  switch (type) {
    case "subscription.created":
    case "subscription.active":
    case "subscription.updated": {
      const userId = await resolveUserId(data);
      if (!userId) {
        log(`[billing] ${type}: could not resolve user for subscription ${data.id}`);
        return;
      }

      // Store the Polar customer ID on the user record if not already set
      const polarCustomerId = data.customerId ?? data.customer?.id;
      if (polarCustomerId) {
        await storage.updateUserPolarCustomerId(userId, polarCustomerId);
      }

      await storage.upsertSubscription(userId, {
        polarSubscriptionId: data.id,
        polarProductId: data.productId,
        plan: resolvePlan(data.productId),
        status: data.status ?? "active",
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      });
      log(`[billing] Subscription upserted for user ${userId} (${type})`);
      break;
    }

    case "subscription.canceled": {
      const userId = await resolveUserId(data);
      if (!userId) return;
      await storage.upsertSubscription(userId, {
        polarSubscriptionId: data.id,
        cancelAtPeriodEnd: true,
        status: data.status ?? "canceled",
      });
      log(`[billing] Subscription marked cancel-at-period-end for user ${userId}`);
      break;
    }

    case "subscription.uncanceled": {
      const userId = await resolveUserId(data);
      if (!userId) return;
      await storage.upsertSubscription(userId, {
        polarSubscriptionId: data.id,
        cancelAtPeriodEnd: false,
        status: "active",
      });
      log(`[billing] Subscription uncanceled for user ${userId}`);
      break;
    }

    case "subscription.revoked": {
      const userId = await resolveUserId(data);
      if (!userId) return;
      await storage.upsertSubscription(userId, {
        polarSubscriptionId: data.id,
        status: "revoked",
        cancelAtPeriodEnd: false,
      });
      log(`[billing] Subscription revoked for user ${userId}`);
      break;
    }

    case "subscription.past_due": {
      const userId = await resolveUserId(data);
      if (!userId) return;
      await storage.upsertSubscription(userId, {
        polarSubscriptionId: data.id,
        status: "past_due",
      });
      log(`[billing] Subscription past_due for user ${userId}`);
      break;
    }

    default:
      log(`[billing] Unhandled event type: ${type}`);
  }
}
