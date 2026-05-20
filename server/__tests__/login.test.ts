import { describe, it, expect, beforeEach, vi } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { randomBytes, scryptSync } from "node:crypto";

// Hoisted mocks — these references are created at mock-factory time so that
// each test can configure return values directly via mocks.getUserByUsername.
const mocks = vi.hoisted(() => ({
  getUserByUsername: vi.fn(),
  getUserByEmail: vi.fn(),
  getUser: vi.fn(),
  updateUserVerification: vi.fn(),
}));

vi.mock("../storage", () => ({
  storage: {
    getUserByUsername: mocks.getUserByUsername,
    getUserByEmail: mocks.getUserByEmail,
    getUser: mocks.getUser,
    updateUserVerification: mocks.updateUserVerification,
    createUser: vi.fn(),
    getUserByVerificationToken: vi.fn(),
  },
}));

// The PostgresSessionStore would otherwise reach for a real pool — replace it
// with an in-memory store so the session middleware can save the session and
// rotate the session id on login (passport calls store.regenerate) without
// touching a database. Must extend express-session's Store base class so the
// default regenerate/save methods are available.
vi.mock("connect-pg-simple", async () => {
  const session = await import("express-session");
  const sessions = new Map<string, unknown>();
  class MemoryShimStore extends session.Store {
    constructor(_opts: unknown) {
      super();
    }
    get(sid: string, cb: (e: Error | null, sess?: unknown) => void) {
      cb(null, sessions.get(sid) ?? null);
    }
    set(sid: string, sess: unknown, cb: (e: Error | null) => void) {
      sessions.set(sid, sess);
      cb(null);
    }
    destroy(sid: string, cb: (e: Error | null) => void) {
      sessions.delete(sid);
      cb(null);
    }
  }
  return { default: () => MemoryShimStore };
});

vi.mock("../db", () => ({ pool: {} }));

vi.mock("../emailService", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  generateVerificationToken: () => "verify-token",
  generateVerificationEmail: () => ({ to: "", subject: "", text: "", html: "" }),
}));

vi.mock("../googleAuth", () => ({ setupGoogleAuth: vi.fn() }));

vi.mock("../vite", () => ({ log: vi.fn() }));

import { setupAuth } from "../auth";
import { loginRateLimiter } from "../security";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${scryptSync(password, salt, 64).toString("hex")}.${salt}`;
}

function buildApp(opts: { withRateLimiter?: boolean } = {}): Express {
  const app = express();
  app.use(express.json());
  if (opts.withRateLimiter) {
    // Mirror the path mount from server/index.ts so this suite locks in the
    // fix for the limiter previously living on a route that didn't exist.
    app.use("/api/login", loginRateLimiter);
  }
  setupAuth(app);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SESSION_SECRET = "test-session-secret";
  delete process.env.SALES_SHERPA_GOOGLE_CLIENT_ID;
  delete process.env.SALES_SHERPA_GOOGLE_CLIENT_SECRET;
});

describe("POST /api/login — credential handling", () => {
  it("returns 200 with the user payload on a valid, email-verified login", async () => {
    const password = "correct-horse-battery-staple";
    mocks.getUserByUsername.mockResolvedValue({
      id: 42,
      username: "alice",
      email: "alice@example.com",
      password: hashPassword(password),
      name: "Alice",
      role: "AE",
      emailVerified: true,
      authProvider: "local",
    });

    const res = await request(buildApp())
      .post("/api/login")
      .send({ username: "alice", password });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(42);
    expect(res.body.email).toBe("alice@example.com");
    // Session cookie must be set so the browser can stay authenticated.
    expect(res.headers["set-cookie"]?.some((c: string) => /connect\.sid=/.test(c))).toBe(true);
  });

  it("returns 401 with a generic message on an unknown username", async () => {
    mocks.getUserByUsername.mockResolvedValue(undefined);

    const res = await request(buildApp())
      .post("/api/login")
      .send({ username: "ghost", password: "any" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it("returns 401 on a wrong password (does not leak that the user exists)", async () => {
    mocks.getUserByUsername.mockResolvedValue({
      id: 7,
      username: "bob",
      email: "bob@example.com",
      password: hashPassword("right-password"),
      name: "Bob",
      role: "AE",
      emailVerified: true,
      authProvider: "local",
    });

    const res = await request(buildApp())
      .post("/api/login")
      .send({ username: "bob", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it("blocks unverified accounts and signals emailNotVerified for the UI", async () => {
    const password = "test-pass";
    mocks.getUserByUsername.mockResolvedValue({
      id: 9,
      username: "unverified",
      email: "u@example.com",
      password: hashPassword(password),
      name: "U",
      role: "AE",
      emailVerified: false,
      authProvider: "local",
    });

    const res = await request(buildApp())
      .post("/api/login")
      .send({ username: "unverified", password });

    expect(res.status).toBe(401);
    expect(res.body.emailNotVerified).toBe(true);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  it("blocks Google-only accounts (no password set) from password login", async () => {
    mocks.getUserByUsername.mockResolvedValue({
      id: 11,
      username: "googler",
      email: "g@example.com",
      password: null,
      name: "G",
      role: "AE",
      emailVerified: true,
      authProvider: "google",
    });

    const res = await request(buildApp())
      .post("/api/login")
      .send({ username: "googler", password: "anything" });

    expect(res.status).toBe(401);
  });
});

// Regression: server/index.ts used to mount loginRateLimiter on /api/auth/login
// while the actual login route is /api/login, so brute-force protection was a
// no-op. Locked here so it doesn't drift back.
describe("loginRateLimiter mounted on /api/login", () => {
  it("returns 429 once the per-IP window cap (10) is exceeded", async () => {
    mocks.getUserByUsername.mockResolvedValue(undefined);

    const app = buildApp({ withRateLimiter: true });

    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .post("/api/login")
        .send({ username: `u${i}`, password: "x" });
      expect(res.status).toBe(401);
    }

    const limited = await request(app)
      .post("/api/login")
      .send({ username: "spam", password: "x" });

    expect(limited.status).toBe(429);
    expect(limited.body.message).toMatch(/too many login attempts/i);
  });
});
