import { describe, it, expect, vi } from "vitest";
import { CURRENT_TERMS_VERSION, TERMS_COOKIE } from "@config/legal";
import { deriveGateKey, signGateToken, userAgentHash } from "../../worker/cookie";
import { GATE_COOKIE, type Deps, type Env } from "../../worker/env";
import { APP_CSP, LEGAL_CSP } from "../../worker/headers";
import { handleRequest, legalAssetPath } from "../../worker/router";

const ORIGIN = "https://ytgenerator.stream";
const UA = "Mozilla/5.0 (Windows NT 10.0) Test";
const NOW = Date.parse("2026-09-30T12:00:00Z");
const SECRET = "test-secret";

/** An ASSETS binding that records what it was asked for. */
function fakeAssets() {
  const calls: { url: string; method: string }[] = [];
  const binding = {
    calls,
    async fetch(request: Request): Promise<Response> {
      const url = new URL(request.url);
      calls.push({ url: url.pathname + url.search, method: request.method });
      if (url.pathname === "/legal/not-found") return new Response("404 page", { status: 404 });
      return new Response(`asset:${url.pathname}`, {
        status: 200,
        headers: { "Content-Type": url.pathname.endsWith(".js") ? "text/javascript" : "text/html" },
      });
    },
  };
  return binding;
}

function makeEnv(overrides: Partial<Env> = {}) {
  const assets = fakeAssets();
  const env: Env = {
    ASSETS: assets,
    TURNSTILE_SITE_KEY: "site-key",
    TURNSTILE_SECRET: SECRET,
    GATE_TTL_SECONDS: "86400",
    ...overrides,
  };
  return { env, assets };
}

function makeDeps(siteverifyBody: unknown = {}): Deps & { fetch: ReturnType<typeof vi.fn> } {
  return {
    now: () => NOW,
    fetch: vi.fn(async () => Response.json(siteverifyBody)),
    randomId: () => "nonce-1234",
  };
}

async function gateCookie(ua = UA): Promise<string> {
  const key = await deriveGateKey(SECRET);
  const token = await signGateToken(key, Math.floor(NOW / 1000) + 3600, await userAgentHash(ua));
  return `${GATE_COOKIE}=${token}`;
}

function req(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  return new Request(`${ORIGIN}${path}`, {
    ...init,
    headers: { "User-Agent": UA, ...init.headers },
  });
}

describe("worker routing — before the gate", () => {
  it("answers a page request with the gate page, not the app", async () => {
    const { env, assets } = makeEnv();
    const res = await handleRequest(req("/output"), env, makeDeps());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.headers.get("Vary")).toContain("Cookie");
    expect(res.headers.get("Content-Security-Policy")).toContain("'nonce-nonce1234'");
    const html = await res.text();
    expect(html).toContain('id="enter"');
    expect(html).toContain('<script nonce="nonce1234">');
    expect(assets.calls).toEqual([]);
  });

  it("speaks the visitor's language", async () => {
    const { env } = makeEnv();
    const res = await handleRequest(
      req("/", { headers: { "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.5" } }),
      env,
      makeDeps(),
    );
    const html = await res.text();
    expect(html).toContain('<html lang="vi">');
    expect(html).toContain("Vào YTDescGen");
  });

  it("skips the agree checkbox for a visitor who already accepted these terms", async () => {
    const { env } = makeEnv();
    const res = await handleRequest(
      req("/", { headers: { Cookie: `${TERMS_COOKIE}=${CURRENT_TERMS_VERSION}` } }),
      env,
      makeDeps(),
    );
    expect(await res.text()).not.toContain('id="agree"');
  });

  it("refuses sub-resources instead of sending the gate page", async () => {
    const { env } = makeEnv();
    const res = await handleRequest(
      req("/data.json", { headers: { "Sec-Fetch-Dest": "empty" } }),
      env,
      makeDeps(),
    );
    expect(res.status).toBe(403);
  });

  it("rejects methods other than GET and HEAD", async () => {
    const { env } = makeEnv();
    const res = await handleRequest(req("/", { method: "PUT" }), env, makeDeps());
    expect(res.status).toBe(405);
  });

  it("treats a gate cookie from another browser as absent", async () => {
    const { env } = makeEnv();
    const res = await handleRequest(
      req("/", { headers: { Cookie: await gateCookie("Some Other Browser") } }),
      env,
      makeDeps(),
    );
    expect(await res.text()).toContain('id="enter"');
  });
});

describe("worker routing — legal pages are always public", () => {
  it.each([
    ["/legal", "/legal/"],
    ["/legal/", "/legal/"],
    ["/legal/privacy", "/legal/privacy"],
    ["/legal/privacy/", "/legal/privacy"],
    ["/legal/disclaimer?lang=vi", "/legal/disclaimer.vi"],
    ["/legal/terms?lang=vi", "/legal/terms"],
    ["/legal/unknown", "/legal/not-found"],
    ["/legal/Privacy", "/legal/not-found"],
  ])("%s → %s", (path, asset) => {
    expect(legalAssetPath(new URL(`${ORIGIN}${path}`))).toBe(asset);
  });

  it("is not a legal path at all for other routes", () => {
    expect(legalAssetPath(new URL(`${ORIGIN}/legality`))).toBeNull();
    expect(legalAssetPath(new URL(`${ORIGIN}/`))).toBeNull();
  });

  it("serves the prerendered page with a script-free CSP, cookie or not", async () => {
    const { env, assets } = makeEnv();
    const res = await handleRequest(req("/legal/privacy"), env, makeDeps());
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("asset:/legal/privacy");
    expect(res.headers.get("Content-Security-Policy")).toBe(LEGAL_CSP);
    expect(assets.calls).toEqual([{ url: "/legal/privacy", method: "GET" }]);
  });

  it("passes through the 404 page for unknown documents", async () => {
    const { env } = makeEnv();
    const res = await handleRequest(req("/legal/nope"), env, makeDeps());
    expect(res.status).toBe(404);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("worker routing — after the gate", () => {
  it("serves the SPA shell for deep links without redirecting to /", async () => {
    const { env, assets } = makeEnv();
    const res = await handleRequest(
      req("/output", { headers: { Cookie: await gateCookie() } }),
      env,
      makeDeps(),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("asset:/");
    expect(assets.calls).toEqual([{ url: "/", method: "GET" }]);
    expect(res.headers.get("Content-Security-Policy")).toBe(APP_CSP);
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("keeps HEAD requests as HEAD", async () => {
    const { env, assets } = makeEnv();
    await handleRequest(
      req("/settings", { method: "HEAD", headers: { Cookie: await gateCookie() } }),
      env,
      makeDeps(),
    );
    expect(assets.calls).toEqual([{ url: "/", method: "HEAD" }]);
  });

  it("passes files with an extension straight to the asset store", async () => {
    const { env, assets } = makeEnv();
    const res = await handleRequest(
      req("/some/file.js", { headers: { Cookie: await gateCookie() } }),
      env,
      makeDeps(),
    );
    expect(await res.text()).toBe("asset:/some/file.js");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(assets.calls).toEqual([{ url: "/some/file.js", method: "GET" }]);
  });

  it("reports cookie status for the gate page's blocked-cookie check", async () => {
    const { env } = makeEnv();
    const ok = await handleRequest(
      req("/__gate/status", { headers: { Cookie: await gateCookie() } }),
      env,
      makeDeps(),
    );
    const missing = await handleRequest(req("/__gate/status"), env, makeDeps());
    expect(ok.status).toBe(204);
    expect(missing.status).toBe(401);
  });
});

describe("worker routing — /__gate/verify", () => {
  const goodSiteverify = {
    success: true,
    hostname: "ytgenerator.stream",
    action: "enter",
    challenge_ts: "2026-09-30T11:59:30Z",
  };

  function verify(body: unknown, headers: Record<string, string> = {}) {
    return req("/__gate/verify", {
      method: "POST",
      headers: { Origin: ORIGIN, "Content-Type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("sets the gate and terms cookies after a valid token", async () => {
    const { env } = makeEnv();
    const deps = makeDeps(goodSiteverify);
    const res = await handleRequest(
      verify({ token: "tok", consent: true }, { "CF-Connecting-IP": "203.0.113.5" }),
      env,
      deps,
    );
    expect(res.status).toBe(200);
    const cookies = res.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    expect(cookies[0]).toMatch(
      /^__Host-ytg_gate=v1\.\d+\.[\w-]+\.[\w-]+; Path=\/; Max-Age=86400; HttpOnly; Secure; SameSite=Lax$/,
    );
    expect(cookies[1]).toBe(
      `${TERMS_COOKIE}=${CURRENT_TERMS_VERSION}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`,
    );
    const body = (deps.fetch.mock.calls[0] as unknown as [string, RequestInit])[1]
      .body as URLSearchParams;
    expect(body.get("remoteip")).toBe("203.0.113.5");

    // The minted cookie is accepted on the next request from the same browser.
    const gate = cookies[0]!.split(";")[0]!;
    const next = await handleRequest(req("/", { headers: { Cookie: gate } }), env, makeDeps());
    expect(await next.text()).toBe("asset:/");
  });

  it.each([
    [
      "a foreign origin",
      verify({ token: "t", consent: true }, { Origin: "https://evil.example" }),
      403,
    ],
    [
      "a non-JSON body",
      verify("token=t", { "Content-Type": "application/x-www-form-urlencoded" }),
      415,
    ],
    ["broken JSON", verify("{nope"), 400],
    ["a missing token", verify({ consent: true }), 400],
    ["no consent", verify({ token: "t" }), 400],
    ["an oversized body", verify({ token: "t", consent: true, pad: "x".repeat(9000) }), 413],
  ])("refuses %s", async (_label, request, status) => {
    const { env } = makeEnv();
    const res = await handleRequest(request, env, makeDeps(goodSiteverify));
    expect(res.status).toBe(status);
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it("refuses a token Cloudflare minted for another hostname", async () => {
    const { env } = makeEnv();
    const res = await handleRequest(
      verify({ token: "t", consent: true }),
      env,
      makeDeps({ ...goodSiteverify, hostname: "attacker.example" }),
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, error: "hostname-mismatch" });
  });

  it("only accepts POST", async () => {
    const { env } = makeEnv();
    const res = await handleRequest(req("/__gate/verify"), env, makeDeps());
    expect(res.status).toBe(405);
  });
});

describe("worker routing — missing secret", () => {
  it("keeps the site up without the gate and refuses verification", async () => {
    const { env } = makeEnv({ TURNSTILE_SECRET: "" });
    const errors = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const page = await handleRequest(req("/output"), env, makeDeps());
    expect(await page.text()).toBe("asset:/");
    const res = await handleRequest(
      req("/__gate/verify", {
        method: "POST",
        headers: { Origin: ORIGIN, "Content-Type": "application/json" },
        body: "{}",
      }),
      env,
      makeDeps(),
    );
    expect(res.status).toBe(503);
    errors.mockRestore();
  });
});
