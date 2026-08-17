import { useMemo } from "react";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { usePendingInvalidStore } from "@store/pending-invalid-store";
import { collectEditorIssues, isRelevantIssueId, type EditorIssue } from "@utils/editor-issues";

/**
 * Everything currently wrong with the editor, from both directions:
 *
 *  - **Saved values** that fail validation — an imported profile, a shared
 *    preset, a draft persisted before a validator got stricter. `ValidatedInput`
 *    refuses to commit invalid text, so imports are in fact the main way bad
 *    data reaches the store.
 *  - **Typed values** that are invalid and therefore *not* saved. Without this
 *    half, a field showing a red error would be invisible to every gate,
 *    because the store it writes to still holds the last good value.
 *
 * Both are filtered through the same relevance check, so a field that is not
 * currently shown — `adEmail` with the split toggle off, `zaloGroupLink` in a
 * non-Vietnamese output — can never block on a value nobody can see or edit.
 */
export function useEditorIssues(): EditorIssue[] {
  const editor = useEditorStore();
  const splitContactEmail = useSettingsStore((s) => s.splitContactEmail);
  const pending = usePendingInvalidStore((s) => s.entries);

  return useMemo(() => {
    const context = { splitContactEmail, language: editor.language };
    const saved = collectEditorIssues(editor, context);
    const seen = new Set(saved.map((i) => i.id));
    const typed: EditorIssue[] = Object.values(pending)
      .filter((entry) => !seen.has(entry.id) && isRelevantIssueId(entry.id, context))
      .map((entry) => ({
        id: entry.id,
        labelKey: entry.labelKey,
        messageKey: entry.messageKey,
        ...(entry.params ? { params: entry.params } : {}),
        severity: "error" as const,
      }));
    return [...saved, ...typed];
  }, [editor, splitContactEmail, pending]);
}

/**
 * Should Strict Mode block this action right now?
 *
 * `false` whenever the setting is off, so every gate is a no-op by default and
 * nobody who hasn't opted in can be stopped by one. Errors only — soft
 * warnings never block.
 */
export function useStrictBlock(): boolean {
  const strictMode = useSettingsStore((s) => s.strictMode);
  const issues = useEditorIssues();
  return strictMode && issues.some((i) => i.severity === "error");
}
