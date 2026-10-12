import { describe, it, expect } from "vitest";
import {
  directCrates,
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

  it("lists every direct Rust crate, not only Tauri's, and the bundled fonts", () => {
    const md = renderNotices();
    for (const name of ["tauri", "tauri-build", "tauri-plugin-single-instance", "serde"]) {
      expect(md).toContain(`| \`${name}\` |`);
    }
    expect(md).toContain("Inter");
    expect(md).toContain("JetBrains Mono");
    expect(md).not.toContain("operating system's fonts");
  });
});

describe("directCrates", () => {
  it("reads the dependency tables only — normal, build and per-target", () => {
    const toml = [
      "[package]",
      'name = "app"',
      'version = "1.0.0"',
      "",
      "[build-dependencies]",
      'tauri-build = { version = "2" }',
      "",
      "[dependencies]",
      'serde = { version = "1", features = ["derive"] }',
      'tauri = "2"',
      "",
      `[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]`,
      'tauri-plugin-single-instance = "2"',
      "",
      "[dev-dependencies]",
      'tempfile = "3"',
    ].join("\r\n");
    expect(directCrates(toml)).toEqual([
      "serde",
      "tauri",
      "tauri-build",
      "tauri-plugin-single-instance",
    ]);
  });
});
