import { describe, it, expect } from "vitest";
import {
  CF_WEB_ANALYTICS_SNIPPET,
  SECURITY_TXT_LIFETIME_DAYS,
  cloudflareWebAnalytics,
  renderSecurityTxt,
} from "../../build-plugins/web-only";

describe("security.txt", () => {
  const now = new Date("2026-09-30T00:00:00Z");
  const txt = renderSecurityTxt(now);
  const field = (name: string) =>
    txt
      .split("\n")
      .filter((line) => line.startsWith(`${name}: `))
      .map((line) => line.slice(name.length + 2));

  it("names the security mailbox and GitHub advisories as contacts", () => {
    expect(field("Contact")).toEqual([
      "mailto:security@poli0981.dev",
      "https://github.com/poli0981/youtube-generator/security/advisories/new",
    ]);
  });

  it("expires under a year after the build, as RFC 9116 recommends", () => {
    const [expires] = field("Expires");
    const days = (Date.parse(expires!) - now.getTime()) / 86_400_000;
    expect(days).toBe(SECURITY_TXT_LIFETIME_DAYS);
    expect(days).toBeLessThan(365);
    expect(expires).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  it("points Canonical and Policy at the live site", () => {
    expect(field("Canonical")).toEqual(["https://ytgenerator.stream/.well-known/security.txt"]);
    expect(field("Policy")).toEqual(["https://ytgenerator.stream/legal/security"]);
    expect(field("Preferred-Languages")).toEqual(["en, vi"]);
  });
});

describe("Cloudflare Web Analytics", () => {
  it("embeds the site's beacon token", () => {
    expect(CF_WEB_ANALYTICS_SNIPPET).toContain('"token": "84187c3714aa49e1ad8ef93ad6d422e7"');
    expect(CF_WEB_ANALYTICS_SNIPPET).toContain(
      "src='https://static.cloudflareinsights.com/beacon.min.js'",
    );
  });

  it("injects the snippet right before </body>", () => {
    const plugin = cloudflareWebAnalytics();
    const transform = plugin.transformIndexHtml as {
      handler: (html: string) => string;
    };
    const out = transform.handler("<html><body><div id=root></div></body></html>");
    expect(out).toBe(
      `<html><body><div id=root></div>${CF_WEB_ANALYTICS_SNIPPET}\n  </body></html>`,
    );
  });
});
