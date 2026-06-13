import { describe, it, expect } from "vitest";
import { needsConsent, CURRENT_TERMS_VERSION, LEGAL_DOCS } from "@config/legal";

/**
 * Guards for the pure legal config driving the v0.28.0 consent gate. The gate
 * is a boot-time blocker, so the version logic must be exactly right: anything
 * below the current version (or a non-number) re-shows the gate; the current
 * version (or higher) lets the app through.
 */
describe("needsConsent", () => {
  it("requires consent at version 0 (never accepted)", () => {
    expect(needsConsent(0)).toBe(true);
  });

  it("requires consent below the current version (terms changed)", () => {
    expect(needsConsent(CURRENT_TERMS_VERSION - 1)).toBe(true);
  });

  it("passes once the current version is accepted", () => {
    expect(needsConsent(CURRENT_TERMS_VERSION)).toBe(false);
  });

  it("passes for a future stored version (never downgrades)", () => {
    expect(needsConsent(CURRENT_TERMS_VERSION + 5)).toBe(false);
  });

  it("treats a non-number as needing consent", () => {
    expect(needsConsent(undefined as unknown as number)).toBe(true);
    expect(needsConsent(NaN)).toBe(true);
  });
});

describe("LEGAL_DOCS", () => {
  it("covers all four documents with absolute https GitHub URLs + consentGate label keys", () => {
    expect(LEGAL_DOCS.map((d) => d.id)).toEqual(["terms", "privacy", "disclaimer", "license"]);
    for (const doc of LEGAL_DOCS) {
      expect(doc.url).toMatch(/^https:\/\/github\.com\/poli0981\/youtube-generator\/blob\/main\//);
      expect(doc.labelKey).toMatch(/^consentGate\.doc/);
    }
  });

  it("has a unique id and url per doc", () => {
    expect(new Set(LEGAL_DOCS.map((d) => d.id)).size).toBe(LEGAL_DOCS.length);
    expect(new Set(LEGAL_DOCS.map((d) => d.url)).size).toBe(LEGAL_DOCS.length);
  });
});
