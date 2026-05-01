import { Polar } from "@polar-sh/sdk";

if (!process.env.POLAR_ACCESS_TOKEN) {
  console.warn("[billing] POLAR_ACCESS_TOKEN not set — billing features disabled");
}

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
});

export async function createCheckoutSession(
  userId: number,
  userEmail: string,
  productId: string
): Promise<string> {
  const baseUrl = process.env.BASE_URL ?? "http://localhost:5000";
  const checkout = await polar.checkouts.create({
    products: [productId],
    successUrl: `${baseUrl}/billing/success?checkout_id={CHECKOUT_ID}`,
    customerEmail: userEmail,
    externalCustomerId: String(userId),
    metadata: { userId: String(userId) },
  });
  return checkout.url!;
}

// Creates a short-lived customer portal session. Prefers Polar customer ID for
// users who already completed a checkout; falls back to externalCustomerId lookup.
export async function createCustomerPortalUrl(
  userId: number,
  polarCustomerId?: string | null
): Promise<string> {
  const args = polarCustomerId
    ? { customerId: polarCustomerId }
    : { externalCustomerId: String(userId) };

  const session = await polar.customerSessions.create(args);
  return session.customerPortalUrl;
}
