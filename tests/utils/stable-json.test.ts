import { describe, expect, it } from "vitest";
import { stableJson } from "@utils/stable-json";

describe("stableJson", () => {
  it("gives equal objects the same JSON whatever their key order", () => {
    expect(stableJson({ b: 1, a: { d: [2, 1], c: null } })).toBe(
      stableJson({ a: { c: null, d: [2, 1] }, b: 1 }),
    );
    expect(stableJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("keeps array order and tells different data apart", () => {
    expect(stableJson([2, 1])).not.toBe(stableJson([1, 2]));
    expect(stableJson({ a: 1 })).not.toBe(stableJson({ a: "1" }));
    expect(stableJson("text")).toBe('"text"');
  });
});
