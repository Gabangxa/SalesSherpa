import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storageSrc = readFileSync(path.resolve(__dirname, "..", "storage.ts"), "utf-8");

// Regression test for the bug fixed in 1c1454a — `storage.getInsights` used to
// chain `.where(userId).where(expiresAt)`, but Drizzle's `select()` only honors
// the first `where`, so expired insights silently leaked into Sherpa's context.
// The fix combines both with `and()`. If anyone reintroduces a second `.where(`
// in this method, this test will catch it before it ships.
describe("storage.getInsights — Drizzle .where() chaining regression", () => {
  function extractMethodBody(src: string, methodName: string): string {
    const re = new RegExp(`async\\s+${methodName}\\s*\\([^)]*\\)\\s*:[^{]*\\{`);
    const start = src.search(re);
    if (start < 0) throw new Error(`could not locate ${methodName} in storage.ts`);
    let depth = 0;
    let i = src.indexOf("{", start);
    const bodyStart = i;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) return src.slice(bodyStart, i + 1);
      }
    }
    throw new Error(`unterminated method body for ${methodName}`);
  }

  const body = extractMethodBody(storageSrc, "getInsights");

  it("calls .where() exactly once (chaining silently drops earlier filters)", () => {
    const matches = body.match(/\.where\s*\(/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("still filters by userId and by an unexpired expiresAt", () => {
    expect(body).toMatch(/eq\s*\(\s*userInsights\.userId\s*,/);
    expect(body).toMatch(/gt\s*\(\s*userInsights\.expiresAt\s*,/);
  });

  it("orders by createdAt descending (most-recent first)", () => {
    expect(body).toMatch(/desc\s*\(\s*userInsights\.createdAt\s*\)/);
  });
});
