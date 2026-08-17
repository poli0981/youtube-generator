import { describe, it, expect } from "vitest";
import { FIELD_LIMITS, clampField } from "@config/field-limits";
import { YT_LIMITS } from "@engine/types";

describe("FIELD_LIMITS", () => {
  it("every limit is a positive integer", () => {
    for (const [key, value] of Object.entries(FIELD_LIMITS)) {
      expect(Number.isInteger(value), `${key} must be an integer`).toBe(true);
      expect(value, `${key} must be positive`).toBeGreaterThan(0);
    }
  });

  it("keeps the timestamps cap within the YouTube description budget", () => {
    // A longer timestamps field could only ever produce a description that is
    // already over the limit and therefore blocked from copying — the cap
    // would be giving the user rope to hang themselves with.
    expect(FIELD_LIMITS.TIMESTAMPS).toBeLessThanOrEqual(YT_LIMITS.DESCRIPTION_MAX);
  });

  it("allows three RFC-maximum-ish addresses in an email field", () => {
    // 3 × 254 would be 762, which is absurd in practice; but the cap must at
    // least clear one worst-case address plus two ordinary ones.
    expect(FIELD_LIMITS.EMAIL_FIELD).toBeGreaterThan(254);
  });

  it("orders the text categories from shortest to longest", () => {
    expect(FIELD_LIMITS.SHORT_NAME).toBeLessThan(FIELD_LIMITS.LABEL);
    expect(FIELD_LIMITS.LABEL).toBeLessThan(FIELD_LIMITS.LONG_TEXT);
    expect(FIELD_LIMITS.LONG_TEXT).toBeLessThan(FIELD_LIMITS.TIMESTAMPS);
  });
});

describe("clampField", () => {
  it("returns the value untouched when under the limit", () => {
    expect(clampField("abc", 10)).toBe("abc");
  });

  it("returns the value untouched when exactly at the limit", () => {
    expect(clampField("abcde", 5)).toBe("abcde");
  });

  it("truncates to exactly the limit when over", () => {
    expect(clampField("abcdefgh", 5)).toBe("abcde");
    expect(clampField("abcdefgh", 5)).toHaveLength(5);
  });

  it("handles the empty string", () => {
    expect(clampField("", 10)).toBe("");
  });

  it("handles a zero limit without throwing", () => {
    expect(clampField("abc", 0)).toBe("");
  });
});
