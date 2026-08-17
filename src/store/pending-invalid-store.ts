import { create } from "zustand";

/**
 * Text a user has typed into a field that is currently invalid.
 *
 * `ValidatedInput` refuses to commit invalid text to the editor store, which
 * is what keeps a malformed URL out of the generated description. The cost is
 * that the editor store looks perfectly clean while the screen shows an error,
 * so a state-derived check (see `@utils/editor-issues`) cannot see it. This
 * store is the missing half: the *typed* state, as opposed to the *saved* one.
 *
 * Two rules make it behave, both learned the hard way:
 *
 *  - **No clearing on unmount.** The first attempt cleared each field's entry
 *    when its input unmounted, which meant leaving the Editor page wiped every
 *    issue — and since the gates live on Batch / Social / Output, Strict Mode
 *    could never block anything on the page you were actually on. An entry is
 *    cleared when the field becomes valid or empty, and only then.
 *  - **Relevance is decided by the reader, not the writer.** A stale entry for
 *    a field that is no longer shown (`adEmail` after the split toggle goes
 *    off) is filtered out where the issues are consumed, alongside the same
 *    filter applied to saved values.
 *
 * Not persisted — this is in-flight typing, not data.
 */

export interface PendingInvalid {
  /** Matches the ids used by `collectEditorIssues`, e.g. `storeLinks.steam`. */
  id: string;
  /** i18n key naming the field. */
  labelKey: string;
  /** i18n key of the failure message. */
  messageKey: string;
  params?: Record<string, string | number>;
}

interface PendingInvalidState {
  entries: Record<string, PendingInvalid>;
  markInvalid: (entry: PendingInvalid) => void;
  clearInvalid: (id: string) => void;
}

function same(a: PendingInvalid | undefined, b: PendingInvalid): boolean {
  if (!a) return false;
  return (
    a.labelKey === b.labelKey &&
    a.messageKey === b.messageKey &&
    JSON.stringify(a.params ?? null) === JSON.stringify(b.params ?? null)
  );
}

export const usePendingInvalidStore = create<PendingInvalidState>()((set) => ({
  entries: {},

  markInvalid: (entry) =>
    set((state) => {
      // Bail when nothing changed. The registering effect runs on every render
      // of the owning input; without this it would publish a fresh object each
      // time and re-render every consumer in a loop.
      if (same(state.entries[entry.id], entry)) return state;
      return { entries: { ...state.entries, [entry.id]: entry } };
    }),

  clearInvalid: (id) =>
    set((state) => {
      if (!(id in state.entries)) return state;
      // Rebuilt by filtering rather than `delete` — eslint's no-dynamic-delete
      // forbids the latter, and this keeps `entries` immutable for
      // referential-equality checks.
      return {
        entries: Object.fromEntries(Object.entries(state.entries).filter(([k]) => k !== id)),
      };
    }),
}));
