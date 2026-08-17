import { useSettingsStore } from "@store/settings-store";
import { useHasValidationErrors } from "@store/validation-store";

/**
 * Should Strict Mode block this action right now?
 *
 * `false` whenever the setting is off, so every gate is a no-op by default and
 * nobody who hasn't opted in can be stopped by one.
 *
 * Errors only — soft warnings (a working link that doesn't match a platform's
 * usual prefix) never block. See `FieldIssue.severity`.
 */
export function useStrictBlock(scope?: string): boolean {
  const strictMode = useSettingsStore((s) => s.strictMode);
  const hasErrors = useHasValidationErrors(scope);
  return strictMode && hasErrors;
}
