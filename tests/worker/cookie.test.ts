import { describe, it, expect } from "vitest";
import {
  deriveGateKey,
  readCookie,
  signGateToken,
  userAgentHash,
  verifyGateToken,
} from "../../worker/cookie";

const NOW = 1_790_000_000;

describe("gate cookie", () => {
  it("round-trips a freshly signed token", async () => {
    const key = await deriveGateKey("secret-a");
    const ua = await userAgentHash("Mozilla/5.0 test");
    const token = await signGateToken(key, NOW + 3600, ua);
    expect(token).toMatch(/^v1\.\d+\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]+$/);
    await expect(verifyGateToken(key, token, NOW, ua)).resolves.toBe(true);
  });

  it("rejects an expired token", async () => {
    const key = await deriveGateKey("secret-a");
    const ua = await userAgentHash("ua");
    const token = await signGateToken(key, NOW - 1, ua);
    await expect(verifyGateToken(key, token, NOW, ua)).resolves.toBe(false);
  });

  it("rejects a token presented by a different User-Agent", async () => {
    const key = await deriveGateKey("secret-a");
    const token = await signGateToken(key, NOW + 3600, await userAgentHash("browser A"));
    await expect(verifyGateToken(key, token, NOW, await userAgentHash("scraper B"))).resolves.toBe(
      false,
    );
  });

  it("rejects a token signed with another secret", async () => {
    const ua = await userAgentHash("ua");
    const token = await signGateToken(await deriveGateKey("old-secret"), NOW + 3600, ua);
    await expect(verifyGateToken(await deriveGateKey("new-secret"), token, NOW, ua)).resolves.toBe(
      false,
    );
  });

  it("rejects any tampering with the payload or signature", async () => {
    const key = await deriveGateKey("secret-a");
    const ua = await userAgentHash("ua");
    const token = await signGateToken(key, NOW + 60, ua);
    const [v, exp, hash, sig] = token.split(".") as [string, string, string, string];
    const extended = [v, String(Number(exp) + 999_999), hash, sig].join(".");
    const flipped = [v, exp, hash, sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A")].join(".");
    for (const bad of [extended, flipped, `v2.${exp}.${hash}.${sig}`, "", "v1", "a.b.c.d"]) {
      await expect(verifyGateToken(key, bad, NOW, ua)).resolves.toBe(false);
    }
  });

  it("derives a stable key per secret", async () => {
    const ua = await userAgentHash("ua");
    const token = await signGateToken(await deriveGateKey("s"), NOW + 10, ua);
    await expect(verifyGateToken(await deriveGateKey("s"), token, NOW, ua)).resolves.toBe(true);
  });
});

describe("readCookie", () => {
  it("finds a cookie among others and trims whitespace", () => {
    expect(readCookie("a=1; __Host-ytg_gate=v1.x.y.z ; b=2", "__Host-ytg_gate")).toBe("v1.x.y.z");
  });

  it("returns null for a missing header or name", () => {
    expect(readCookie(null, "a")).toBeNull();
    expect(readCookie("b=1", "a")).toBeNull();
    expect(readCookie("xa=1", "a")).toBeNull();
  });
});
