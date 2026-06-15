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

  it("falls back to a valid v4 UUID when crypto.randomUUID is missing (Android WebView < 92)", () => {
    // Chromium 91 has getRandomValues but not randomUUID — the exact gap that
    // black-screened the app at boot before the fallback existed.
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: (a: Uint8Array) => real.getRandomValues(a),
    });
    expect(generateId()).toMatch(V4);
  });

  it("falls back to a valid v4 UUID when crypto is entirely absent", () => {
    vi.stubGlobal("crypto", undefined);
    expect(generateId()).toMatch(V4);
  });

  it("produces unique values across many calls", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => generateId()));
    expect(ids.size).toBe(1000);
  });
});
