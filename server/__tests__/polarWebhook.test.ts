import { describe, it, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";

// Mock the Polar SDK so we control signature verification outcome.
vi.mock("@polar-sh/sdk/webhooks", () => {
  class WebhookVerificationError extends Error {
    constructor(msg: string) {
      super(msg);
      this.name = "WebhookVerificationError";
    }
  }
  return {
    validateEvent: vi.fn(),
    WebhookVerificationError,
  };
});

// Storage writes happen asynchronously after the response; we don't care about
// the actual DB here — just that the handler returns the right status code.
vi.mock("../storage", () => ({
  storage: {
    getUserByPolarCustomerId: vi.fn().mockResolvedValue(undefined),
    updateUserPolarCustomerId: vi.fn().mockResolvedValue(undefined),
    upsertSubscription: vi.fn().mockResolvedValue(undefined),
  },
}));

// Suppress test-log noise.
vi.mock("../vite", () => ({ log: vi.fn() }));

import { handlePolarWebhook } from "../billing/webhookHandler";
import {
  validateEvent,
  WebhookVerificationError,
} from "@polar-sh/sdk/webhooks";

const mockedValidate = validateEvent as unknown as ReturnType<typeof vi.fn>;

function makeApp() {
  const app = express();
  app.post(
    "/webhooks/polar",
    express.raw({ type: "application/json" }),
    handlePolarWebhook,
  );
  return app;
}

describe("POST /webhooks/polar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.POLAR_WEBHOOK_SECRET = "test-secret";
  });

  it("rejects an invalid signature with 403", async () => {
    mockedValidate.mockImplementation(() => {
      throw new WebhookVerificationError("bad signature");
    });

    const res = await request(makeApp())
      .post("/webhooks/polar")
      .set("content-type", "application/json")
      .send({ stub: true });

    expect(res.status).toBe(403);
    expect(res.text).toContain("Invalid webhook signature");
  });

  it("returns 400 on non-verification parse errors", async () => {
    mockedValidate.mockImplementation(() => {
      throw new Error("malformed body");
    });

    const res = await request(makeApp())
      .post("/webhooks/polar")
      .set("content-type", "application/json")
      .send({});

    expect(res.status).toBe(400);
  });

  it("acknowledges a verified event with 202 (Polar requires <10s)", async () => {
    mockedValidate.mockReturnValue({
      type: "subscription.created",
      data: { id: "sub_test", customer: { externalId: "1" }, productId: "free" },
    });

    const res = await request(makeApp())
      .post("/webhooks/polar")
      .set("content-type", "application/json")
      .send({ ok: true });

    expect(res.status).toBe(202);
  });

  it("forwards the request body and headers to validateEvent", async () => {
    mockedValidate.mockReturnValue({
      type: "subscription.updated",
      data: { id: "sub_test", productId: "free" },
    });

    await request(makeApp())
      .post("/webhooks/polar")
      .set("content-type", "application/json")
      .set("webhook-id", "evt_123")
      .send({ id: "evt_123" });

    expect(mockedValidate).toHaveBeenCalledTimes(1);
    const [body, headers, secret] = mockedValidate.mock.calls[0];
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(headers["webhook-id"]).toBe("evt_123");
    expect(secret).toBe("test-secret");
  });
});
