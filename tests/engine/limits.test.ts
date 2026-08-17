import { describe, it, expect } from "vitest";
import {
  getOutputLimitStatus,
  mergeLimitStatus,
  EMPTY_LIMIT_STATUS,
  type OutputLimitStatus,
} from "@engine/limits";
import { renderAll } from "@engine/template-renderer";
import { YT_LIMITS, type CharLimitWarning, type GeneratorInput } from "@engine/types";
import { DEFAULTS } from "@config/defaults";
import { createMockT } from "../helpers/mock-t";

function warning(
  field: CharLimitWarning["field"],
  current: number,
  limit: number,
): CharLimitWarning {
  return { field, current, limit, message: `${field} over` };
}

function status(...warnings: CharLimitWarning[]): OutputLimitStatus {
  return getOutputLimitStatus({ warnings });
}

describe("getOutputLimitStatus", () => {
  it("is not blocked when there are no warnings", () => {
    expect(status()).toEqual(EMPTY_LIMIT_STATUS);
    expect(status().blocked).toBe(false);
  });

  it("blocks on a single over-limit field and reports it", () => {
    const result = status(warning("title", 130, 100));
    expect(result.blocked).toBe(true);
    expect(result.overflows).toEqual([{ field: "title", current: 130, limit: 100 }]);
  });

  it("reports every offending field in title → description → tags order", () => {
    // Pushed out of order on purpose — display order must not depend on it.
    const result = status(
      warning("tags", 600, 500),
      warning("title", 130, 100),
      warning("description", 5200, 5000),
    );
    expect(result.overflows.map((o) => o.field)).toEqual(["title", "description", "tags"]);
  });

  it("drops the engine's hardcoded English message", () => {
    // It exists on CharLimitWarning but is unusable in a localized UI, so the
    // status must not carry it through to the components.
    const result = status(warning("title", 130, 100));
    expect(result.overflows[0]).not.toHaveProperty("message");
  });
});

describe("mergeLimitStatus", () => {
  it("returns the empty status for no inputs", () => {
    expect(mergeLimitStatus([])).toEqual(EMPTY_LIMIT_STATUS);
  });

  it("stays unblocked when every input is clean", () => {
    expect(mergeLimitStatus([status(), status()]).blocked).toBe(false);
  });

  it("blocks when any single input is over", () => {
    const merged = mergeLimitStatus([status(), status(warning("title", 130, 100))]);
    expect(merged.blocked).toBe(true);
  });

  it("dedupes by field and keeps the worst offender", () => {
    // Five Batch rows all over on description must yield ONE banner line.
    const merged = mergeLimitStatus([
      status(warning("description", 5100, 5000)),
      status(warning("description", 6400, 5000)),
      status(warning("description", 5300, 5000)),
    ]);
    expect(merged.overflows).toHaveLength(1);
    expect(merged.overflows[0]?.current).toBe(6400);
  });

  it("keeps distinct fields separate and ordered", () => {
    const merged = mergeLimitStatus([
      status(warning("tags", 600, 500)),
      status(warning("title", 130, 100)),
    ]);
    expect(merged.overflows.map((o) => o.field)).toEqual(["title", "tags"]);
  });
});

describe("integration with renderAll", () => {
  function makeInput(overrides: Partial<GeneratorInput> = {}): GeneratorInput {
    return {
      ...(DEFAULTS.editor as unknown as GeneratorInput),
      videoType: "full",
      language: "en",
      genres: ["horror"],
      gameName: "Test Game",
      ...overrides,
    };
  }

  it("does not block an ordinary output", () => {
    const output = renderAll(makeInput(), createMockT("en"));
    expect(getOutputLimitStatus(output).blocked).toBe(false);
  });

  it("blocks a title pushed past the YouTube limit", () => {
    const output = renderAll(
      makeInput({ gameName: "G".repeat(YT_LIMITS.TITLE_MAX + 50) }),
      createMockT("en"),
    );
    const result = getOutputLimitStatus(output);
    expect(result.blocked).toBe(true);
    expect(result.overflows.some((o) => o.field === "title")).toBe(true);
  });

  it("blocks a description pushed past the YouTube limit", () => {
    const output = renderAll(
      makeInput({ timestamps: "0:00 Intro\n".repeat(600) }),
      createMockT("en"),
    );
    const result = getOutputLimitStatus(output);
    expect(result.blocked).toBe(true);
    expect(result.overflows.some((o) => o.field === "description")).toBe(true);
  });

  it("treats an empty output (locale still loading) as unblocked", () => {
    // EMPTY_GENERATOR_OUTPUT has no warnings. Copy buttons must be disabled by
    // the empty-text check, not by this one claiming a false overflow.
    expect(getOutputLimitStatus({ warnings: [] }).blocked).toBe(false);
  });
});
