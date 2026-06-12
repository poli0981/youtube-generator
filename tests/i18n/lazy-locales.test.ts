import { describe, it, expect } from "vitest";
import i18n, { ensureLanguagesLoaded } from "@i18n/index";
import viTemplates from "../../src/i18n/locales/vi/templates.json";

/**
 * v0.26 lazy-loaded locales: `en` ships in the main bundle (the engine's
 * bilingual `tEn` fallback must work synchronously), every other language
 * is fetched on demand via dynamic import. These tests pin both halves of
 * that contract against the real i18next singleton.
 *
 * Order matters: the "not bundled at import time" assertion must run
 * before anything calls `ensureLanguagesLoaded(["vi"])`.
 */
describe("lazy locale loading", () => {
  it("bundles en eagerly and synchronously", () => {
    expect(i18n.isInitialized).toBe(true);
    expect(i18n.hasResourceBundle("en", "ui")).toBe(true);
    expect(i18n.hasResourceBundle("en", "templates")).toBe(true);
    expect(i18n.getFixedT("en", "templates")("title.suffix")).toBe(
      "Gameplay No Commentary",
    );
  });

  it("does not bundle non-English languages at import time", () => {
    expect(i18n.hasResourceBundle("vi", "ui")).toBe(false);
    expect(i18n.hasResourceBundle("vi", "templates")).toBe(false);
  });

  it("loads a language on demand and serves its real strings", async () => {
    await ensureLanguagesLoaded(["vi"]);
    expect(i18n.hasResourceBundle("vi", "ui")).toBe(true);
    expect(i18n.hasResourceBundle("vi", "templates")).toBe(true);
    const t = i18n.getFixedT("vi", "templates");
    // Compare against the JSON on disk, not a hardcoded copy, so locale
    // edits can't silently invalidate the test.
    expect(t("title.videoType.part", { partNumber: "2" })).toBe(
      viTemplates.title.videoType.part.replace("{{partNumber}}", "2"),
    );
  });

  it("is idempotent for already-loaded and bundled languages", async () => {
    await expect(
      ensureLanguagesLoaded(["vi", "en"]),
    ).resolves.toBeUndefined();
    expect(i18n.hasResourceBundle("vi", "templates")).toBe(true);
  });
});
