import {
  wrapEnvelope,
  detectShape,
  resolveForType,
  type ExportType,
  type DetectedShape,
} from "./file-schema";

/**
 * Distinct failure modes the import pipeline surfaces to callers.
 * Lets the UI render targeted toasts (and i18n keys, when we wire
 * those up in a future release) instead of a single "Import failed"
 * for every problem.
 *
 * - `cancelled`: user dismissed the file picker — handle silently.
 * - `read-failed`: file picker resolved but reading raised (rare on
 *   web, more common on Tauri when the dialog cancellation race
 *   condition hits).
 * - `empty`: file existed but was zero bytes / whitespace only.
 * - `parse-error`: JSON parse threw — `message` carries the parser's
 *   line/col so the user can fix the file.
 * - `wrong-shape`: parsed JSON is structurally invalid (not an
 *   object/array, or `_type` mismatch for the caller's expected
 *   type). `actual` is the detected type when known so the UI can
 *   suggest switching tabs.
 * - `newer-schema`: file was exported by a future app version with
 *   an incompatible schema — refuse rather than risk silent data
 *   corruption.
 */
export type ImportFailure =
  | { kind: "cancelled" }
  | { kind: "read-failed"; message: string }
  | { kind: "empty" }
  | { kind: "parse-error"; message: string }
  | { kind: "wrong-shape"; expected: ExportType; actual: ExportType | null }
  | { kind: "newer-schema"; expected: ExportType; actual: number; supported: number };

export type ImportResult<T> =
  | { ok: true; data: T; sourceVersion?: number }
  | { ok: false; failure: ImportFailure };

/**
 * Write `data` to a download as a typed envelope JSON file. The
 * envelope marker lets a later import auto-detect the file's type
 * (see {@link importTypedFromJsonFile}).
 */
export function exportTypedToJsonFile<T>(
  type: ExportType,
  data: T,
  filename: string,
): void {
  const envelope = wrapEnvelope(type, data);
  const json = JSON.stringify(envelope, null, 2);
  triggerDownload(json, filename);
}

function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Read a JSON file from the user's disk and resolve to its parsed
 * payload, classified by {@link detectShape}. Splits the "failure"
 * paths so callers can render targeted toasts.
 *
 * This is the low-level reader — the typed wrapper
 * {@link importTypedFromJsonFile} layers `resolveForType` on top so
 * callers get a `{ ok: true; data: T }` discriminated union.
 *
 * Why not throw? Because every callsite had to swallow the throw and
 * convert it back to a toast anyway — making failures values keeps
 * the contract honest and forces handling at the call site.
 */
export function importParsedFromJsonFile(): Promise<
  { ok: true; shape: DetectedShape; rawText: string } | { ok: false; failure: ImportFailure }
> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    let settled = false;
    const settle = (
      result:
        | { ok: true; shape: DetectedShape; rawText: string }
        | { ok: false; failure: ImportFailure },
    ) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    // Browsers don't expose a reliable "user pressed cancel" event on
    // <input type=file>. Fall back to focus-on-window heuristic: when
    // the picker closes (either via OK or cancel), the window regains
    // focus. If `onchange` hasn't fired by the next tick, treat as
    // cancelled. The 250 ms wait covers slow desktops.
    const onFocus = () => {
      window.removeEventListener("focus", onFocus);
      setTimeout(() => settle({ ok: false, failure: { kind: "cancelled" } }), 250);
    };
    window.addEventListener("focus", onFocus, { once: true });
    input.onchange = () => {
      window.removeEventListener("focus", onFocus);
      const file = input.files?.[0];
      if (!file) {
        settle({ ok: false, failure: { kind: "cancelled" } });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        if (!text.trim()) {
          settle({ ok: false, failure: { kind: "empty" } });
          return;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          settle({
            ok: false,
            failure: { kind: "parse-error", message: String(e) },
          });
          return;
        }
        settle({ ok: true, shape: detectShape(parsed), rawText: text });
      };
      reader.onerror = () =>
        settle({
          ok: false,
          failure: { kind: "read-failed", message: String(reader.error ?? "unknown") },
        });
      reader.readAsText(file);
    };
    input.click();
  });
}

/**
 * High-level typed import. Wraps {@link importParsedFromJsonFile} with
 * {@link resolveForType} so the caller specifies the expected file
 * type ("profile" / "preset" / "template" / …) and gets back either
 * the validated payload or a structured failure.
 *
 * The returned `data` field is `unknown` because the underlying JSON
 * may carry rows that fail per-field validation — narrow it via the
 * per-store import function (each of which now filters malformed
 * rows). This keeps the contract honest: passing the typing burden
 * to a single validator instead of trusting the call site.
 */
export async function importTypedFromJsonFile(
  expectedType: ExportType,
): Promise<ImportResult<unknown>> {
  const read = await importParsedFromJsonFile();
  if (!read.ok) return { ok: false, failure: read.failure };

  const resolved = resolveForType(read.shape, expectedType);
  if (!resolved.ok) {
    switch (resolved.reason.kind) {
      case "wrong-type":
        return {
          ok: false,
          failure: {
            kind: "wrong-shape",
            expected: expectedType,
            actual: resolved.reason.actual,
          },
        };
      case "unknown-shape":
        return {
          ok: false,
          failure: { kind: "wrong-shape", expected: expectedType, actual: null },
        };
      case "newer-schema":
        return {
          ok: false,
          failure: {
            kind: "newer-schema",
            expected: expectedType,
            actual: resolved.reason.actual,
            supported: resolved.reason.supported,
          },
        };
    }
  }
  return { ok: true, data: resolved.data, sourceVersion: resolved.sourceVersion };
}
