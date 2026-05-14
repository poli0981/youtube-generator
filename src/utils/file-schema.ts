/**
 * Export-file envelope + shape detection.
 *
 * Motivation: prior to v0.15.0 every export was a bare JSON value
 * (`Profile[]`, `GamePreset[]`, `EditorTemplate[]`, …) with no
 * type marker. Users routinely confused the files — importing a
 * templates dump into the Profiles tab silently injected entries
 * with `social: undefined` that later crashed the editor render.
 *
 * The envelope adds a discriminator (`_type`) + version metadata so
 * imports can:
 *
 * 1. Detect "you opened a Template file in the Profiles importer"
 *    and offer to switch tabs, rather than silently failing.
 * 2. Migrate older shapes forward via per-type `healX` hooks.
 * 3. Stay forward-compatible — files exported by future versions
 *    carry their `_schemaVersion`, so older builds can warn instead
 *    of corrupting state.
 *
 * Backward compatibility: legacy files (pre-v0.15 bare arrays /
 * objects) are detected by {@link detectShape} and routed through the
 * same import pipeline. Nothing breaks; users just lose the
 * "wrong-tab" warning until they re-export.
 */

export const APP_MARKER = "ytdescgen" as const;

/** Kinds of payload the app can round-trip via JSON files. The string
 *  literal IS the on-disk discriminator — don't rename without writing
 *  a back-compat alias. */
export type ExportType =
  | "profile"
  | "preset"
  | "template"
  | "settings"
  | "history";

/** Versioned wrapper written by every v0.15+ export. */
export interface ExportEnvelope<T = unknown> {
  /** Static marker so a foreign JSON file (e.g. some other tool's
   *  export) can be rejected before we even look at `_type`. */
  _app: typeof APP_MARKER;
  _type: ExportType;
  /** Per-type schema version — bumped when the inner shape changes
   *  in a non-additive way. Allows targeted migrations without
   *  touching the rest of the envelope. */
  _schemaVersion: number;
  _exportedAt: string;
  /** App version that wrote the file. Informational only — never
   *  used as a migration key (the per-type `_schemaVersion` is). */
  _appVersion?: string;
  data: T;
}

/** Schema-version map. Bump the entry when you make a breaking change
 *  to the corresponding store's persisted shape AND want imports to
 *  branch on it. Additive changes (new optional fields) don't need a
 *  bump — `healX` functions back-fill them on load. */
export const SCHEMA_VERSIONS: Record<ExportType, number> = {
  profile: 1, // v0.11 added `thirdPartyAdText`
  preset: 2, // v0.5 added `genres[]` (was `genre`)
  template: 1, // v0.11 vendor-coercion
  settings: 9, // matches settings-store persist version
  history: 2, // v0.5 added `genres[]` to HistoryEntry
};

/**
 * Wrap `data` in an {@link ExportEnvelope}. Use this on the writer
 * side — every v0.15+ export funnels through here so the envelope
 * stays consistent.
 */
export function wrapEnvelope<T>(type: ExportType, data: T): ExportEnvelope<T> {
  return {
    _app: APP_MARKER,
    _type: type,
    _schemaVersion: SCHEMA_VERSIONS[type],
    _exportedAt: new Date().toISOString(),
    data,
  };
}

/** Result of inspecting an imported JSON payload. */
export type DetectedShape =
  | { kind: "envelope"; type: ExportType; schemaVersion: number; data: unknown }
  | { kind: "legacy"; guessedType: ExportType | null; data: unknown }
  | { kind: "unknown"; data: unknown };

/**
 * Inspect a parsed JSON payload and classify it.
 *
 * Order of preference:
 *
 * 1. Envelope (`_app === "ytdescgen"` + valid `_type`) — authoritative,
 *    skip shape-sniffing.
 * 2. Legacy shape detection on a bare array / object — best-effort
 *    guess by characteristic fields (e.g. `social` + `rig` on an
 *    array element → profiles).
 * 3. Unknown — give up; caller surfaces a "wrong shape" toast.
 *
 * Pure — exported for unit tests.
 */
export function detectShape(parsed: unknown): DetectedShape {
  if (!parsed || typeof parsed !== "object") {
    return { kind: "unknown", data: parsed };
  }

  // 1. Envelope path.
  const maybe = parsed as Partial<ExportEnvelope>;
  if (
    maybe._app === APP_MARKER &&
    typeof maybe._type === "string" &&
    isExportType(maybe._type)
  ) {
    return {
      kind: "envelope",
      type: maybe._type,
      schemaVersion:
        typeof maybe._schemaVersion === "number" ? maybe._schemaVersion : 0,
      data: maybe.data,
    };
  }

  // 2. Legacy shape detection.
  if (Array.isArray(parsed)) {
    return { kind: "legacy", guessedType: guessArrayType(parsed), data: parsed };
  }
  if (typeof parsed === "object") {
    // `Record<string, unknown>` — could be a bare SettingsData or the
    // multi-store dump the Tauri settings.json writer produces (the
    // latter is keyed by `ytdescgen-settings` / `ytdescgen-profiles`).
    const asRecord = parsed as Record<string, unknown>;
    if ("ytdescgen-settings" in asRecord || "appLanguage" in asRecord) {
      return { kind: "legacy", guessedType: "settings", data: parsed };
    }
  }

  return { kind: "unknown", data: parsed };
}

/** Type-guard helper so the `ExportType` literal stays the source of
 *  truth (don't duplicate the list). */
function isExportType(value: string): value is ExportType {
  return (
    value === "profile" ||
    value === "preset" ||
    value === "template" ||
    value === "settings" ||
    value === "history"
  );
}

/**
 * Best-effort: peek at the first non-null array element and guess its
 * type by characteristic fields. Returns `null` if the array is empty
 * or the first element doesn't match any known shape — callers should
 * treat that as "wrong shape" and ask the user to choose the type.
 */
function guessArrayType(arr: unknown[]): ExportType | null {
  const sample = arr.find((x) => !!x && typeof x === "object") as
    | Record<string, unknown>
    | undefined;
  if (!sample) return null;

  // Templates have a top-level `snapshot` object — most distinctive
  // field.
  if (typeof sample.snapshot === "object" && sample.snapshot !== null) {
    return "template";
  }
  // Profiles carry channel-level data (channelName / social / rig).
  if (
    typeof sample.channelName === "string" ||
    (typeof sample.social === "object" && typeof sample.rig === "object")
  ) {
    return "profile";
  }
  // Presets carry game-level data (gameName + storeLinks).
  if (
    typeof sample.gameName === "string" &&
    typeof sample.storeLinks === "object"
  ) {
    return "preset";
  }
  // History entries always have a `createdAt` + (title|description|tags).
  if (
    typeof sample.createdAt === "string" &&
    (typeof sample.title === "string" || typeof sample.tags === "string")
  ) {
    return "history";
  }
  return null;
}

/**
 * Resolve a detection result to the actual payload, given the type the
 * caller expects to import.
 *
 * Returns `{ ok: true, data }` when the payload is usable, or
 * `{ ok: false, reason }` when the import should be rejected and the
 * caller should surface a toast. The `reason` field carries enough
 * context for the UI to suggest a fix (e.g. switch tabs).
 */
export function resolveForType(
  shape: DetectedShape,
  expected: ExportType,
):
  | { ok: true; data: unknown; sourceVersion?: number }
  | {
      ok: false;
      reason:
        | { kind: "wrong-type"; actual: ExportType }
        | { kind: "unknown-shape" }
        | { kind: "newer-schema"; actual: number; supported: number };
    } {
  switch (shape.kind) {
    case "envelope": {
      if (shape.type === expected) {
        if (shape.schemaVersion > SCHEMA_VERSIONS[expected]) {
          return {
            ok: false,
            reason: {
              kind: "newer-schema",
              actual: shape.schemaVersion,
              supported: SCHEMA_VERSIONS[expected],
            },
          };
        }
        return { ok: true, data: shape.data, sourceVersion: shape.schemaVersion };
      }
      return { ok: false, reason: { kind: "wrong-type", actual: shape.type } };
    }
    case "legacy": {
      if (shape.guessedType === expected || shape.guessedType === null) {
        // Either the guess matches, or we couldn't guess and have to
        // trust the user's tab choice. Both paths fall through to the
        // existing import validator in the per-store importX function,
        // which will skip any rows that don't have the right fields.
        return { ok: true, data: shape.data };
      }
      return {
        ok: false,
        reason: { kind: "wrong-type", actual: shape.guessedType },
      };
    }
    case "unknown":
      return { ok: false, reason: { kind: "unknown-shape" } };
  }
}
