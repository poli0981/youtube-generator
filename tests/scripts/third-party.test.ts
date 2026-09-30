import { describe, it, expect } from "vitest";
import {
  disallowedProductionLicenses,
  licenseAllowed,
  renderNotices,
} from "../../scripts/lib/third-party";

describe("licenseAllowed", () => {
  it.each([
    ["MIT", true],
    ["Apache-2.0 OR MIT", true],
    ["MIT OR GPL-3.0-only", true],
    ["(MIT OR Apache-2.0)", true],
    ["BSD-3-Clause AND MIT", true],
    ["Apache-2.0 AND LGPL-3.0-or-later", false],
    ["GPL-3.0-only", false],
    ["AGPL-3.0-or-later", false],
    ["UNKNOWN", false],
    ["", false],
  ])("%s → %s", (expression, allowed) => {
    expect(licenseAllowed(expression)).toBe(allowed);
  });
});

describe("the installed tree", () => {
  it("ships no package under a license outside the allowlist", () => {
    expect(disallowedProductionLicenses()).toEqual([]);
  });

  it("renders notices that list every runtime dependency and the Cloudflare services", () => {
    const md = renderNotices();
    for (const name of ["react", "zustand", "i18next", "@tauri-apps/api"]) {
      expect(md).toContain(`| \`${name}\` |`);
    }
    expect(md).toContain("Cloudflare Turnstile");
    expect(md).toContain("/licenses/third-party.md");
  });
});
