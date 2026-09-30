import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";
import { APP_CSP, BASELINE_HEADERS, LEGAL_CSP, gateCsp } from "../../worker/headers";

/** Parse the `/*` block of public/_headers into name → value. */
function staticHeadersForAllPaths(): Record<string, string> {
  const text = readFileSync(resolve(import.meta.dirname, "../../public/_headers"), "utf8");
  const out: Record<string, string> = {};
  let inBlock = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("#") || line.trim() === "") continue;
    if (!line.startsWith(" ")) {
      inBlock = line.trim() === "/*";
      continue;
    }
    if (!inBlock) continue;
    const colon = line.indexOf(":");
    out[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return out;
}

describe("security headers", () => {
  const staticHeaders = staticHeadersForAllPaths();

  it("gives Worker responses the same baseline as static files", () => {
    for (const [name, value] of Object.entries(BASELINE_HEADERS)) {
      if (name === "Cross-Origin-Resource-Policy") continue; // set per path in _headers
      expect(staticHeaders[name], name).toBe(value);
    }
  });

  it("serves the app shell under the same CSP either way", () => {
    expect(staticHeaders["Content-Security-Policy"]).toBe(APP_CSP);
  });

  it("never sets HSTS — the zone edge owns it", () => {
    expect(Object.keys(staticHeaders).map((h) => h.toLowerCase())).not.toContain(
      "strict-transport-security",
    );
    expect(Object.keys(BASELINE_HEADERS).map((h) => h.toLowerCase())).not.toContain(
      "strict-transport-security",
    );
  });

  it("lets only the analytics beacon in beside our own scripts", () => {
    expect(APP_CSP).toContain("script-src 'self' https://static.cloudflareinsights.com;");
    expect(APP_CSP).toContain("connect-src 'self' https://cloudflareinsights.com;");
    expect(APP_CSP).not.toContain("'unsafe-eval'");
    expect(APP_CSP).toMatch(/script-src [^;]*$|script-src [^;]*;/);
    expect(APP_CSP.match(/script-src ([^;]*)/)?.[1]).not.toContain("'unsafe-inline'");
  });

  it("allows Turnstile only on the gate page, with a per-request nonce", () => {
    const csp = gateCsp("abc123");
    expect(csp).toContain(
      "script-src 'nonce-abc123' 'strict-dynamic' https://challenges.cloudflare.com",
    );
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(APP_CSP).not.toContain("challenges.cloudflare.com");
  });

  it("allows no script at all on the prerendered legal pages", () => {
    expect(LEGAL_CSP).toContain("default-src 'none'");
    expect(LEGAL_CSP).not.toContain("script-src");
  });
});
