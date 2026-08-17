import { describe, it, expect } from "vitest";
import { readdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { initialSettings } from "@store/settings-heal";
import { CORE_TAGS_BY_LANG, MULTILINGUAL_TAGS } from "@engine/tag-generator";

/**
 * Adding a locale means editing four separate places, and only two of them
 * fail loudly on their own:
 *
 *   1. `SUPPORTED_LANGUAGES`      (src/i18n/index.ts)     — silent if missed
 *   2. `SupportedLanguage` union  (src/engine/types.ts)   — compile error
 *   3. `detectBrowserLanguage`    (settings-heal.ts)      — SILENT if missed
 *   4. `MULTILINGUAL_TAGS` / `CORE_TAGS_BY_LANG`          — compile error
 *
 * docs/I18N.md claimed for a long time that (1) was the only step. It isn't,
 * and (3) in particular fails invisibly: the language works, and simply never
 * auto-selects for a visitor whose browser is set to it.
 *
 * These tests close the two silent gaps by checking the picker list against
 * what is actually on disk, in both directions.
 */

const LOCALES_DIR = resolve("src/i18n/locales");

function localeDirsOnDisk(): string[] {
  return readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

describe("locale registration", () => {
  it("offers exactly the locales that exist on disk", () => {
    const registered = SUPPORTED_LANGUAGES.map((l) => l.id as string).sort();
    expect(registered).toEqual(localeDirsOnDisk());
  });

  it("ships both namespaces for every registered locale", () => {
    for (const { id } of SUPPORTED_LANGUAGES) {
      for (const ns of ["ui", "templates"]) {
        expect(existsSync(join(LOCALES_DIR, id, `${ns}.json`)), `${id}/${ns}.json`).toBe(true);
      }
    }
  });

  it("gives every registered locale a flag and a native name", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(lang.flag, `${lang.id} flag`).toBeTruthy();
      expect(lang.nativeName, `${lang.id} nativeName`).toBeTruthy();
      // The native name is what the picker shows. An English label there means
      // someone copied a row and forgot to translate it.
      expect(lang.label, `${lang.id} label`).toBeTruthy();
    }
  });

  it("has a tag pool for every registered locale", () => {
    // Both are typed `Record<SupportedLanguage, …>` so TypeScript already
    // enforces this — but only against the union, not against the picker list.
    for (const { id } of SUPPORTED_LANGUAGES) {
      expect(typeof CORE_TAGS_BY_LANG[id], `CORE_TAGS_BY_LANG.${id}`).toBe("function");
      expect(typeof MULTILINGUAL_TAGS[id], `MULTILINGUAL_TAGS.${id}`).toBe("function");
    }
  });

  it("produces non-empty, game-name-bearing tags for every locale", () => {
    for (const { id } of SUPPORTED_LANGUAGES) {
      const core = CORE_TAGS_BY_LANG[id]("Silent Hill 2");
      expect(core.length, `${id} core tags`).toBeGreaterThan(0);
      expect(
        core.some((t) => t.includes("Silent Hill 2")),
        `${id} core tags use the game name`,
      ).toBe(true);
    }
  });

  it("defaults the app language to a registered locale", () => {
    const registered = SUPPORTED_LANGUAGES.map((l) => l.id as string);
    expect(registered).toContain(initialSettings.appLanguage);
    expect(registered).toContain(initialSettings.defaultOutputLanguage);
  });
});
