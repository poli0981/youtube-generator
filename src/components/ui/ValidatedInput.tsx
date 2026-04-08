import { useState, useCallback } from "react";
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
}

export function ValidatedInput({
  label,
  value,
  onChange,
  validate,
  placeholder,
  helpText,
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
        setError(null);
        onChange(newValue);
      } else if (result.valid && result.error) {
        // Warning (valid but prefix mismatch)
        setError(t(result.error, result.errorParams as Record<string, string>));
        onChange(newValue);
      } else {
        setError(t(result.error ?? "", result.errorParams as Record<string, string>));
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
