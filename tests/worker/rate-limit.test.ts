import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, vi } from "vitest";
import { RATE_LIMIT_PERIOD_SECONDS, type Env } from "../../worker/env";
import { isRateLimited, rateLimitKey, tooManyRequests } from "../../worker/rate-limit";

interface RateLimitConfig {
  name: string;
  namespace_id: string;
  simple: { limit: number; period: number };
}

/** wrangler.jsonc without its `//` comments (it has no trailing commas). */
function readWranglerConfig(): { ratelimits?: RateLimitConfig[] } {
  const text = readFileSync(resolve(import.meta.dirname, "../../wrangler.jsonc"), "utf8");
  let json = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inString) {
      json += ch;
      if (ch === "\\") json += text[++i] ?? "";
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
      json += ch;
    } else if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      json += "\n";
    } else {
      json += ch;
    }
  }
  return JSON.parse(json) as { ratelimits?: RateLimitConfig[] };
}

function envWith(overrides: Partial<Env>): Env {
  return {
    ASSETS: { fetch: async () => new Response("") },
    TURNSTILE_SITE_KEY: "site-key",
    TURNSTILE_SECRET: "secret",
    ...overrides,
  };
}

const request = (ip?: string) =>
  new Request("https://ytgenerator.stream/", {
    headers: ip === undefined ? {} : { "CF-Connecting-IP": ip },
  });

describe("rateLimitKey", () => {
  it.each([
    [null, "unknown"],
    ["", "unknown"],
    ["203.0.113.9", "203.0.113.9"],
    [" 203.0.113.9 ", "203.0.113.9"],
    ["2001:DB8:0001:0002:0003:4:5:6", "2001:db8:1:2::/64"],
    ["2001:db8:1:2::1", "2001:db8:1:2::/64"],
    ["2001:db8::1", "2001:db8:0:0::/64"],
    ["::1", "0:0:0:0::/64"],
    ["fe80::", "fe80:0:0:0::/64"],
    ["::", "0:0:0:0::/64"],
    ["::ffff:198.51.100.4", "198.51.100.4"],
    ["64:ff9b::192.0.2.1", "64:ff9b:0:0::/64"],
    ["1:2:3:4:5:6:192.0.2.1", "1:2:3:4::/64"],
  ])("%s → %s", (ip, key) => {
    expect(rateLimitKey(ip)).toBe(key);
  });

  it.each(["1::2::3", "1:2:3", "1:2:3:4:5:6:7:8:9", "1:2:3:4:5:6:7::8", "zz::1", "12345::1"])(
    "keeps the unparseable %s as it is",
    (ip) => {
      expect(rateLimitKey(ip)).toBe(ip);
    },
  );
});

describe("isRateLimited", () => {
  it("lets traffic through without a binding, and says so once", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const env = envWith({});
    expect(await isRateLimited(request("203.0.113.9"), env, true)).toBe(false);
    expect(await isRateLimited(request("203.0.113.9"), env, false)).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("lets traffic through when the limiter fails, and says so once", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const broken = {
      limit: vi.fn(async (): Promise<{ success: boolean }> => {
        throw new Error("unavailable");
      }),
    };
    const env = envWith({ RATE_LIMIT: broken, VERIFY_RATE_LIMIT: broken });
    expect(await isRateLimited(request("203.0.113.9"), env, true)).toBe(false);
    expect(await isRateLimited(request("203.0.113.9"), env, true)).toBe(false);
    expect(broken.limit).toHaveBeenCalledTimes(4);
    expect(error).toHaveBeenCalledTimes(1);
    error.mockRestore();
  });

  it("asks each limiter with the client's key", async () => {
    const general = { limit: vi.fn(async () => ({ success: true })) };
    const verify = { limit: vi.fn(async () => ({ success: false })) };
    const env = envWith({ RATE_LIMIT: general, VERIFY_RATE_LIMIT: verify });
    expect(await isRateLimited(request("2001:db8::7"), env, false)).toBe(false);
    expect(await isRateLimited(request("2001:db8::7"), env, true)).toBe(true);
    expect(general.limit).toHaveBeenCalledWith({ key: "2001:db8:0:0::/64" });
    expect(verify.limit).toHaveBeenCalledTimes(1);
    expect(await isRateLimited(request(), env, false)).toBe(false);
    expect(general.limit).toHaveBeenLastCalledWith({ key: "unknown" });
  });
});

describe("tooManyRequests", () => {
  it("answers the verify call in JSON and everything else in plain text", async () => {
    const json = tooManyRequests(true);
    const text = tooManyRequests(false);
    for (const res of [json, text]) {
      expect(res.status).toBe(429);
      expect(res.headers.get("Retry-After")).toBe(String(RATE_LIMIT_PERIOD_SECONDS));
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    }
    expect(await json.json()).toEqual({ ok: false, error: "rate-limited" });
    expect(text.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
  });
});

describe("wrangler.jsonc ratelimits", () => {
  const limits = readWranglerConfig().ratelimits ?? [];

  it("binds the two limiters the Worker reads", () => {
    expect(limits.map((entry) => entry.name)).toEqual(["RATE_LIMIT", "VERIFY_RATE_LIMIT"]);
  });

  it("uses one period, the one Retry-After announces", () => {
    for (const entry of limits) expect(entry.simple.period).toBe(RATE_LIMIT_PERIOD_SECONDS);
  });

  it("gives each limiter its own namespace and a positive limit", () => {
    const ids = limits.map((entry) => entry.namespace_id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of limits) {
      expect(entry.namespace_id).toMatch(/^[1-9]\d*$/);
      expect(entry.simple.limit).toBeGreaterThan(0);
    }
  });

  it("keeps verify stricter than the general limit", () => {
    const [general, verify] = limits;
    expect(verify!.simple.limit).toBeLessThan(general!.simple.limit);
  });
});
