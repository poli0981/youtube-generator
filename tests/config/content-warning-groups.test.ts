import { describe, it, expect } from "vitest";
import { CONTENT_WARNING_GROUPS } from "@config/content-warning-groups";
import { CONTENT_WARNINGS } from "@engine/types";

/**
 * Parity guard between the engine's flat CONTENT_WARNINGS union and the
 * editor's CONTENT_WARNING_GROUPS. TypeScript already rejects a group item
 * that isn't a valid ContentWarning, but nothing else catches an id added
 * to the engine list and forgotten from every group — it would silently
 * never appear in the UI. No hard counts asserted on purpose: the guard
 * shouldn't need touching when warnings are added correctly.
 */
describe("CONTENT_WARNING_GROUPS ↔ CONTENT_WARNINGS parity", () => {
  const grouped = CONTENT_WARNING_GROUPS.flatMap((g) => g.items);

  it("contains no duplicate ids across groups", () => {
    const seen = new Set<string>();
    const dupes = grouped.filter((id) => {
      if (seen.has(id)) return true;
      seen.add(id);
      return false;
    });
    expect(dupes).toEqual([]);
  });

  it("covers every engine warning id exactly (none missing, none extra)", () => {
    const missingFromGroups = CONTENT_WARNINGS.filter((id) => !grouped.includes(id));
    const unknownInGroups = grouped.filter(
      (id) => !(CONTENT_WARNINGS as readonly string[]).includes(id),
    );
    expect(missingFromGroups).toEqual([]);
    expect(unknownInGroups).toEqual([]);
  });
});
