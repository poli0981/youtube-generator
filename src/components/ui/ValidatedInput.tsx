import { useState, useCallback, type ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { ValidationResult } from "@utils/validation";
import clsx from "clsx";

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validate: (value: string) => ValidationResult;
  placeholder?: string;
  helpText?: string;
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
  value,
  onChange,
  validate,
  placeholder,
  helpText,
  onPaste,
}: ValidatedInputProps) {
  const { t } = useTranslation("ui");
  const [displayValue, setDisplayValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const handleChange = useCallback(
    (newValue: string) => {
      setDisplayValue(newValue);
      const result = validate(newValue);
      if (result.valid && !result.error) {
        // Fully valid: commit the value to the store.
        setError(null);
        onChange(newValue);
      } else if (result.valid && result.error) {
        // Warning (e.g. prefix mismatch from validateUrlWithPrefix).
        // Surface the warning but still commit so the user can decide.
        setError(t(result.error, result.errorParams as Record<string, string>));
        onChange(newValue);
      } else {
        // Invalid: show the error and CLEAR the committed value so the
        // bad input never reaches the generated description/tags. The
        // local displayValue is preserved so the user can keep editing.
        setError(t(result.error ?? "", result.errorParams as Record<string, string>));
        onChange("");
      }
      setTouched(true);
    },
    [validate, onChange, t],
  );

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
        className={clsx(
          "rounded-lg border bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50",
          touched && error ? "border-danger" : "border-border focus:border-accent",
        )}
      />
      {touched && error && <p className="text-xs text-danger">{error}</p>}
      {helpText && !error && <p className="text-xs text-text-muted">{helpText}</p>}
    </div>
  );
}
