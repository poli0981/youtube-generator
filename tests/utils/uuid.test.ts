import { describe, it, expect, afterEach, vi } from "vitest";
import { generateId } from "@utils/uuid";

// RFC 4122 v4: 8-4-4-4-12 hex, version nibble "4", variant nibble 8/9/a/b.
const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateId", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a valid v4 UUID via the native crypto.randomUUID path", () => {
    expect(generateId()).toMatch(V4);
  });

  it("falls back to a valid v4 UUID when crypto.randomUUID is missing", () => {
    // Insecure contexts (and Chromium < 92) have getRandomValues but not
    // randomUUID — the gap that once black-screened the app at boot.
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: (a: Uint8Array<ArrayBuffer>) => real.getRandomValues(a),
    });
    expect(generateId()).toMatch(V4);
  });

  it("refuses to make up an ID when there is no crypto at all", () => {
    // No Math.random fallback: an ID that is not random is worse than an
    // error. Every engine the app supports has crypto.getRandomValues.
    vi.stubGlobal("crypto", undefined);
    expect(() => generateId()).toThrow(TypeError);
  });

  it("produces unique values across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });
});
