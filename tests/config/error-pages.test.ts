import { describe, it, expect } from "vitest";
import {
  ERROR_PAGES,
  resolveErrorMeta,
  severityTextClass,
  type ErrorKind,
} from "@config/error-pages";
import enUI from "@i18n/locales/en/ui.json";

/**
 * Guards for the pure error-page config that drives ErrorPage + the routes in
 * App.tsx. TypeScript already enforces the kind→meta shape via `satisfies`;
 * these catch what types can't: a code typo, a duplicate keyPrefix, or a
 * keyPrefix with no matching i18n copy (which would render a raw key string).
 * Complements `validate:locales`, which only proves key *parity* across
 * locales, not that the config points at keys that exist.
 */
const KINDS: ErrorKind[] = [
  "notFound",
  "forbidden",
  "expired",
  "serverError",
  "offline",
  "runtime",
];

describe("ERROR_PAGES config", () => {
  it("maps exactly the six known kinds", () => {
    expect(Object.keys(ERROR_PAGES).sort()).toEqual([...KINDS].sort());
  });

  it("assigns the expected HTTP codes (null for non-HTTP states)", () => {
    expect(ERROR_PAGES.notFound.code).toBe(404);
    expect(ERROR_PAGES.forbidden.code).toBe(403);
    expect(ERROR_PAGES.expired.code).toBe(419);
    expect(ERROR_PAGES.serverError.code).toBe(500);
    expect(ERROR_PAGES.offline.code).toBeNull();
    expect(ERROR_PAGES.runtime.code).toBeNull();
  });

  it("has a unique keyPrefix per kind", () => {
    const prefixes = KINDS.map((k) => ERROR_PAGES[k].keyPrefix);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it("resolveErrorMeta returns the matching entry", () => {
    for (const k of KINDS) {
      expect(resolveErrorMeta(k)).toBe(ERROR_PAGES[k]);
    }
  });

  it("severityTextClass maps every severity to a text-colour token", () => {
    expect(severityTextClass("danger")).toBe("text-danger");
    expect(severityTextClass("warning")).toBe("text-warning");
    expect(severityTextClass("accent")).toBe("text-accent");
  });

  it("every kind has a localized title + description in en/ui.json", () => {
    const errorPages = (
      enUI as unknown as {
        errorPages: Record<string, { title?: string; description?: string }>;
      }
    ).errorPages;
    for (const k of KINDS) {
      const prefix = ERROR_PAGES[k].keyPrefix;
      expect(errorPages[prefix]?.title, `${prefix}.title`).toBeTruthy();
      expect(errorPages[prefix]?.description, `${prefix}.description`).toBeTruthy();
    }
  });
});
