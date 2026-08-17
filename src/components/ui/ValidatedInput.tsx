import { useState, useCallback, useEffect, useRef, type ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ValidationResult } from "@utils/validation";
import { usePendingInvalidStore } from "@store/pending-invalid-store";
import clsx from "clsx";

interface ValidatedInputProps {
  label: string;
  /**
   * Stable id matching the one `collectEditorIssues` uses for the same field
   * (`storeLinks.steam`, `contactEmail`). Supplying it lets Strict Mode see
   * text that is invalid *and therefore never committed to the editor store* —
   * without it, such a field is invisible to every gate outside this page.
   */
  fieldId?: string;
  /** i18n key naming the field in the Strict Mode banner. */
  labelKey?: string;
  value: string;
  onChange: (value: string) => void;
  validate: (value: string) => ValidationResult;
  placeholder?: string;
  helpText?: string;
  inputMode?: "text" | "email" | "url" | "numeric" | "tel" | "search" | "decimal";
  autoComplete?: string;
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  /**
   * Hard cap on typed/pasted length — see `src/config/field-limits.ts`. This
   * component does not spread props onto the input, so unlike `Input` it needs
   * the prop declared explicitly.
   */
  maxLength?: number;
  /**
   * Veto or rewrite a change before it is validated or committed. Return the
   * (possibly adjusted) next value to accept it, or `null` to reject the
   * keystroke outright, leaving the field exactly as it was.
   *
   * Used for constraints a validator cannot express without destroying data —
   * the three-address email cap, where rejecting the 4th address must not
   * disturb the three already typed.
   */
  beforeChange?: (next: string, prev: string) => string | null;
  /** Shown instead of `helpText` when `beforeChange` rejects a change. */
  blockedMessage?: string;
  /**
   * Forwarded to the inner `<input>`. Used by StoreLinkEditor to sniff a
   * pasted URL and auto-fill the Game Name field — see
   * `extractGameNameFromUrl`. The handler runs alongside the normal paste
   * flow; nothing here interferes with the value committed via onChange.
   */
  onPaste?: (e: ClipboardEvent<HTMLInputElement>) => void;
}

export function ValidatedInput({
  label,
  fieldId,
  labelKey,
  value,
  onChange,
  validate,
  placeholder,
  helpText,
  inputMode,
  autoComplete,
  enterKeyHint,
  maxLength,
  beforeChange,
  blockedMessage,
  onPaste,
}: ValidatedInputProps) {
  const { t } = useTranslation("ui");
  const [displayValue, setDisplayValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // Re-sync when the value changes underneath us — applying a profile, preset
  // or template, or resetting the editor. Without this the box kept showing
  // whatever was typed first and silently disagreed with the store, because
  // `useState(value)` only reads the prop on mount.
  //
  // Guarded on `displayValue` so it never fights the user's own typing: while
  // they type, `value` and `displayValue` already agree (or `value` is the last
  // valid one, in which case an external change is what we want to adopt).
  const lastExternalValue = useRef(value);
  useEffect(() => {
    if (value !== lastExternalValue.current) {
      lastExternalValue.current = value;
      setDisplayValue(value);
      setError(null);
      setBlocked(false);
    }
  }, [value]);

  const handleChange = useCallback(
    (rawValue: string) => {
      const next = beforeChange ? beforeChange(rawValue, displayValue) : rawValue;
      if (next === null) {
        // Rejected outright — leave both the display and the committed value
        // untouched so nothing already entered is lost.
        setBlocked(true);
        setTouched(true);
        return;
      }
      setBlocked(false);
      setDisplayValue(next);
      lastExternalValue.current = next;

      const result = validate(next);
      if (result.valid && !result.error) {
        // Fully valid: commit the value to the store.
        setError(null);
        onChange(next);
      } else if (result.valid && result.error) {
        // Warning (e.g. prefix mismatch from validateUrlWithPrefix).
        // Surface the warning but still commit so the user can decide.
        setError(t(result.error, result.errorParams as Record<string, string>));
        onChange(next);
      } else {
        // Invalid: surface the error and DON'T commit, so the bad input never
        // reaches the generated description/tags.
        //
        // Before v0.35.0 this branch called `onChange("")`, which wiped the
        // stored value while the box still showed the user's text — so
        // backspacing one character out of a complete URL silently emptied the
        // field, and autosave/profile-save then persisted the empty value with
        // no visible signal. Leaving the last valid value in place keeps bad
        // input out just as effectively without destroying good input.
        setError(t(result.error ?? "", result.errorParams as Record<string, string>));
      }
      setTouched(true);
    },
    [validate, onChange, t, beforeChange, displayValue],
  );

  const message = blocked ? (blockedMessage ?? error) : error;

  // Publish "this field currently holds text that will not be saved" so gates
  // on other pages can see it. Keyed on the raw validation result rather than
  // the rendered message, which is already translated and would re-publish on
  // every UI-language change.
  const liveResult = validate(displayValue);
  const isInvalid = blocked || (!liveResult.valid && displayValue.trim() !== "");
  const invalidKey = blocked ? "validation.emailMaxReached" : (liveResult.error ?? "");
  const invalidParams = JSON.stringify(liveResult.errorParams ?? null);

  useEffect(() => {
    if (!fieldId) return;
    const { markInvalid, clearInvalid } = usePendingInvalidStore.getState();
    if (isInvalid) {
      const parsed = JSON.parse(invalidParams) as Record<string, string | number> | null;
      markInvalid({
        id: fieldId,
        labelKey: labelKey ?? label,
        messageKey: invalidKey,
        ...(parsed ? { params: parsed } : {}),
      });
    } else {
      clearInvalid(fieldId);
    }
    // Deliberately NO cleanup on unmount — see the store's doc comment. An
    // entry lives until the field is valid again, so navigating to Batch does
    // not silently clear the very thing Strict Mode is supposed to catch.
  }, [fieldId, labelKey, label, isInvalid, invalidKey, invalidParams]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        onPaste={onPaste}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        maxLength={maxLength}
        aria-invalid={touched && Boolean(message) ? true : undefined}
        className={clsx(
          "focus:ring-accent/50 min-h-touch rounded-lg border bg-surface-1 px-3 py-2.5 text-base text-text-primary transition-colors placeholder:text-text-muted focus:outline-none focus:ring-2 sm:text-sm",
          touched && message ? "border-danger" : "border-border focus:border-accent",
        )}
      />
      {touched && message && <p className="text-xs text-danger">{message}</p>}
      {helpText && !message && <p className="text-xs text-text-muted">{helpText}</p>}
    </div>
  );
}
