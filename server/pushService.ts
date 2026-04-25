import webpush from "web-push";
import { log } from "./vite";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY ?? "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY ?? "";
const vapidEmail = process.env.VAPID_EMAIL ?? "mailto:admin@salessherpa.com";

export const isWebPushConfigured = !!(vapidPublicKey && vapidPrivateKey);

if (isWebPushConfigured) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  log(`[push] VAPID configured — email=${vapidEmail} pubkey=...${vapidPublicKey.slice(-8)}`, "push");
} else {
  log("[push] VAPID keys not set — web push disabled (set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_EMAIL)", "push");
}

export { vapidPublicKey };

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export type SendResult = "ok" | "expired" | "error";

export interface SendDetail {
  result: SendResult;
  endpoint: string;
  /** Only present on "error" */
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Send a push notification to a single subscription.
 *
 * Returns:
 *   "ok"      — delivered successfully
 *   "expired" — endpoint returned 404/410, subscription should be deleted
 *   "error"   — delivery failed for another reason; do NOT delete the subscription
 */
export async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<SendDetail> {
  const ep = `...${subscription.endpoint.slice(-40)}`;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload)
    );
    log(`[push] delivered ok → ${ep}`, "push");
    return { result: "ok", endpoint: ep };
  } catch (err: any) {
    const code: number | undefined = err.statusCode ?? err.status;
    const msg: string = err.body ?? err.message ?? String(err);

    if (code === 404 || code === 410) {
      log(`[push] subscription expired (HTTP ${code}) → ${ep}`, "push");
      return { result: "expired", endpoint: ep, errorCode: code, errorMessage: msg };
    }

    log(`[push] delivery failed (HTTP ${code ?? "?"}) → ${ep} | ${msg}`, "push");
    return { result: "error", endpoint: ep, errorCode: code, errorMessage: msg };
  }
}
