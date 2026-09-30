import { describe, it, expect } from "vitest";
import {
  CURRENT_TERMS_VERSION,
  LEGAL_DOCS,
  LEGAL_DOC_IDS,
  TERMS_COOKIE,
  isLegalDocId,
  legalDocPath,
  needsConsent,
  termsVersionFromCookie,
} from "@config/legal";

/**
 * Guards for the pure legal config driving the consent gate, the in-app Legal
 * Center, the static /legal pages and the Cloudflare Worker. The gate is a
 * boot-time blocker, so the version logic must be exactly right: anything
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

  it("re-asks users who accepted v1 — the v1.0.0 Privacy Policy changed materially", () => {
    expect(CURRENT_TERMS_VERSION).toBeGreaterThanOrEqual(2);
    expect(needsConsent(1)).toBe(true);
  });
});

describe("LEGAL_DOCS", () => {
  it("lists the consent documents first, in agreement order", () => {
    expect(LEGAL_DOCS.filter((d) => d.consent).map((d) => d.id)).toEqual([
      "terms",
      "privacy",
      "disclaimer",
      "license",
    ]);
  });

  it("has unique ids, label keys and sources", () => {
    for (const key of ["id", "labelKey", "source"] as const) {
      expect(new Set(LEGAL_DOCS.map((d) => d[key])).size).toBe(LEGAL_DOCS.length);
    }
  });

  it("keys every label under legal.docs and points every source at a repo file", () => {
    for (const doc of LEGAL_DOCS) {
      expect(doc.labelKey).toMatch(/^legal\.docs\.[a-zA-Z]+$/);
      expect(doc.source).toMatch(/^[A-Z_]+(\.md)?$/);
    }
  });

  it("serves every document under /legal/<id>", () => {
    for (const id of LEGAL_DOC_IDS) {
      expect(legalDocPath(id)).toBe(`/legal/${id}`);
      expect(isLegalDocId(id)).toBe(true);
    }
    expect(isLegalDocId("nope")).toBe(false);
    expect(isLegalDocId("")).toBe(false);
  });
});

describe("termsVersionFromCookie", () => {
  it("reads the version the gate page recorded", () => {
    expect(termsVersionFromCookie(`a=1; ${TERMS_COOKIE}=2; b=3`)).toBe(2);
    expect(termsVersionFromCookie(`${TERMS_COOKIE}=12`)).toBe(12);
  });

  it("returns null when absent, empty or malformed", () => {
    expect(termsVersionFromCookie(undefined)).toBeNull();
    expect(termsVersionFromCookie("")).toBeNull();
    expect(termsVersionFromCookie("other=2")).toBeNull();
    expect(termsVersionFromCookie(`${TERMS_COOKIE}=abc`)).toBeNull();
    expect(termsVersionFromCookie(`${TERMS_COOKIE}=-1`)).toBeNull();
    expect(termsVersionFromCookie(`${TERMS_COOKIE}=99999`)).toBeNull();
  });

  it("does not match a cookie whose name merely ends with the same text", () => {
    expect(termsVersionFromCookie(`x${TERMS_COOKIE}=2`)).toBeNull();
  });
});
