import { describe, it, expect } from "vitest";
import {
  APP_MARKER,
  SCHEMA_VERSIONS,
  detectShape,
  resolveForType,
  wrapEnvelope,
} from "@utils/file-schema";

describe("wrapEnvelope", () => {
  it("produces an envelope with the marker, type, and per-type schema version", () => {
    const env = wrapEnvelope("profile", [{ id: "p1", name: "Test" }]);
    expect(env._app).toBe(APP_MARKER);
    expect(env._type).toBe("profile");
    expect(env._schemaVersion).toBe(SCHEMA_VERSIONS.profile);
    expect(typeof env._exportedAt).toBe("string");
    expect(env.data).toEqual([{ id: "p1", name: "Test" }]);
  });

  it("round-trips data unchanged", () => {
    const data = { foo: 1, bar: [2, 3] };
    expect(wrapEnvelope("settings", data).data).toBe(data);
  });
});

describe("detectShape", () => {
  it("classifies a well-formed envelope by its _type", () => {
    const env = wrapEnvelope("template", [{ id: "t1", snapshot: {} }]);
    const shape = detectShape(env);
    expect(shape.kind).toBe("envelope");
    if (shape.kind !== "envelope") return;
    expect(shape.type).toBe("template");
    expect(shape.schemaVersion).toBe(SCHEMA_VERSIONS.template);
  });

  it("rejects an envelope with a foreign _app marker", () => {
    const shape = detectShape({
      _app: "some-other-tool",
      _type: "profile",
      _schemaVersion: 1,
      data: [],
    });
    expect(shape.kind).not.toBe("envelope");
  });

  it("guesses profile from an array with channelName/social/rig sample", () => {
    const shape = detectShape([
      { id: "p1", channelName: "Skullmute", social: {}, rig: {} },
    ]);
    expect(shape.kind).toBe("legacy");
    if (shape.kind !== "legacy") return;
    expect(shape.guessedType).toBe("profile");
  });

  it("guesses template by snapshot field on the array sample", () => {
    const shape = detectShape([{ id: "t1", name: "X", snapshot: { gameName: "G" } }]);
    expect(shape.kind).toBe("legacy");
    if (shape.kind !== "legacy") return;
    expect(shape.guessedType).toBe("template");
  });

  it("guesses preset by gameName + storeLinks combo", () => {
    const shape = detectShape([
      { id: "g1", gameName: "Doom", storeLinks: { steam: "https://example" } },
    ]);
    expect(shape.kind).toBe("legacy");
    if (shape.kind !== "legacy") return;
    expect(shape.guessedType).toBe("preset");
  });

  it("guesses settings when the object has the multi-store dump key", () => {
    const shape = detectShape({ "ytdescgen-settings": { theme: "dark" } });
    expect(shape.kind).toBe("legacy");
    if (shape.kind !== "legacy") return;
    expect(shape.guessedType).toBe("settings");
  });

  it("returns unknown for null / primitive / unrecognised shapes", () => {
    expect(detectShape(null).kind).toBe("unknown");
    expect(detectShape("foo").kind).toBe("unknown");
    expect(detectShape(42).kind).toBe("unknown");
    expect(detectShape([{ weird: "field" }]).kind).toBe("legacy");
    // Empty array → legacy with guessedType null (no sample to inspect).
    const empty = detectShape([]);
    if (empty.kind === "legacy") expect(empty.guessedType).toBeNull();
  });
});

describe("resolveForType", () => {
  it("accepts an envelope whose type matches the expected type", () => {
    const env = wrapEnvelope("profile", [{ id: "p1" }]);
    const shape = detectShape(env);
    const result = resolveForType(shape, "profile");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toEqual([{ id: "p1" }]);
    expect(result.sourceVersion).toBe(SCHEMA_VERSIONS.profile);
  });

  it("returns wrong-type when the envelope type does not match", () => {
    const env = wrapEnvelope("template", [{ id: "t1", snapshot: {} }]);
    const shape = detectShape(env);
    const result = resolveForType(shape, "profile");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    if (result.reason.kind !== "wrong-type") throw new Error("expected wrong-type");
    expect(result.reason.actual).toBe("template");
  });

  it("returns newer-schema when the envelope's schema version is too high", () => {
    const env = {
      _app: APP_MARKER,
      _type: "profile" as const,
      _schemaVersion: 999,
      _exportedAt: "2099-01-01",
      data: [],
    };
    const shape = detectShape(env);
    const result = resolveForType(shape, "profile");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    if (result.reason.kind !== "newer-schema") throw new Error("expected newer-schema");
    expect(result.reason.actual).toBe(999);
    expect(result.reason.supported).toBe(SCHEMA_VERSIONS.profile);
  });

  it("accepts legacy data with a guess matching the expected type", () => {
    const shape = detectShape([{ id: "p1", channelName: "X", social: {}, rig: {} }]);
    const result = resolveForType(shape, "profile");
    expect(result.ok).toBe(true);
  });

  it("accepts legacy data with no guess (trusts the user's tab choice)", () => {
    const shape = detectShape([]); // empty array → guessedType null
    const result = resolveForType(shape, "preset");
    expect(result.ok).toBe(true);
  });

  it("rejects legacy data whose guess contradicts the expected type", () => {
    const shape = detectShape([{ id: "t1", snapshot: {} }]); // looks like a template
    const result = resolveForType(shape, "profile");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    if (result.reason.kind !== "wrong-type") throw new Error("expected wrong-type");
    expect(result.reason.actual).toBe("template");
  });

  it("rejects unknown-shape payloads", () => {
    const shape = detectShape(42);
    const result = resolveForType(shape, "settings");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason.kind).toBe("unknown-shape");
  });
});

describe("envelope round-trip", () => {
  it("survives JSON.stringify / parse and is recognised by detectShape", () => {
    const env = wrapEnvelope("preset", [{ id: "g1", gameName: "Doom" }]);
    const reparsed = JSON.parse(JSON.stringify(env));
    const shape = detectShape(reparsed);
    expect(shape.kind).toBe("envelope");
    if (shape.kind !== "envelope") return;
    expect(shape.type).toBe("preset");
  });
});
