import { create } from "zustand";

/**
 * A live, app-wide view of which fields are currently invalid.
 *
 * Before v0.35.0 there was no such view at all. Every error lived in the
 * private `useState` of the input that produced it, so nothing outside that
 * component could know the form was in a bad state — which is why the
 * "generate anyway" path existed: not by choice, but because no caller could
 * ask the question.
 *
 * Deliberately NOT persisted. Issues are derived from the current field
 * values; rehydrating a stale error would mean showing a warning about text
 * the user can no longer see. On reload each input re-validates and
 * re-registers.
 */

export type IssueSeverity = "error" | "warning";

export interface FieldIssue {
  /** Stable, unique per field. Composed for loops, e.g. `editor.social.twitch`. */
  id: string;
  /** Grouping for the banners — `"editor"`, `"settings"`. */
  scope: string;
  /**
   * Human-readable field name for the banner, already translated. Call sites
   * pass the same string they render as the input's label, so the banner and
   * the field agree without a second key to keep in sync.
   */
  label: string;
  /** i18n key of the message itself. */
  messageKey: string;
  params?: Record<string, string | number>;
  /**
   * Only `"error"` blocks in Strict Mode. `validateUrlWithPrefix` produces a
   * soft warning for a link that works but doesn't match the platform's usual
   * prefix — treating that as fatal would strand anyone on a vanity domain or
   * a regional mirror.
   */
  severity: IssueSeverity;
}

interface ValidationState {
  issues: Record<string, FieldIssue>;
  setIssue: (issue: FieldIssue) => void;
  clearIssue: (id: string) => void;
  clearScope: (scope: string) => void;
}

function sameIssue(a: FieldIssue | undefined, b: FieldIssue): boolean {
  if (!a) return false;
  return (
    a.scope === b.scope &&
    a.label === b.label &&
    a.messageKey === b.messageKey &&
    a.severity === b.severity &&
    JSON.stringify(a.params ?? null) === JSON.stringify(b.params ?? null)
  );
}

export const useValidationStore = create<ValidationState>()((set) => ({
  issues: {},

  setIssue: (issue) =>
    set((state) => {
      // Bail out when nothing changed. The registering effect runs on every
      // render of the owning input; without this guard it would publish a new
      // `issues` object each time and re-render every consumer forever.
      if (sameIssue(state.issues[issue.id], issue)) return state;
      return { issues: { ...state.issues, [issue.id]: issue } };
    }),

  clearIssue: (id) =>
    set((state) => {
      if (!(id in state.issues)) return state;
      // Rebuilt by filtering rather than `delete` — `@typescript-eslint`'s
      // no-dynamic-delete forbids the latter, and this keeps `issues`
      // immutable for referential-equality checks.
      const issues = Object.fromEntries(Object.entries(state.issues).filter(([k]) => k !== id));
      return { issues };
    }),

  clearScope: (scope) =>
    set((state) => {
      const issues = Object.fromEntries(
        Object.entries(state.issues).filter(([, v]) => v.scope !== scope),
      );
      return Object.keys(issues).length === Object.keys(state.issues).length ? state : { issues };
    }),
}));

/**
 * Does any registered issue block?
 *
 * Returns a primitive, so it is safe to use directly as a selector — Zustand
 * compares with `Object.is`, and a derived array would be a new reference on
 * every store read.
 */
export function useHasValidationErrors(scope?: string): boolean {
  return useValidationStore((s) =>
    Object.values(s.issues).some(
      (i) => i.severity === "error" && (scope === undefined || i.scope === scope),
    ),
  );
}

/**
 * The blocking issues, for the banner that lists them.
 *
 * Selects the stable `issues` record and derives outside the selector, for the
 * same referential-equality reason as above.
 */
export function useValidationErrors(scope?: string): FieldIssue[] {
  const issues = useValidationStore((s) => s.issues);
  return Object.values(issues).filter(
    (i) => i.severity === "error" && (scope === undefined || i.scope === scope),
  );
}
