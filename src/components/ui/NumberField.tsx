import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "./Input";

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** Receives a whole number within [min, max]; never called with anything else. */
  onCommit: (value: number) => void;
  /** Hint under the field; defaults to the allowed range. */
  help?: string;
}

/**
 * A whole-number setting that is saved when the user is done typing (blur or
 * Enter). The inputs this replaces clamped on every keystroke, so clearing
 * "100" to type "250" snapped straight back to the minimum. An out-of-range
 * value is kept on screen with an inline error instead of being saved;
 * Escape restores the saved value.
 */
export function NumberField({ label, value, min, max, onCommit, help }: NumberFieldProps) {
  const { t } = useTranslation("ui");
  // null while not editing, so outside changes (an import) still show up.
  const [draft, setDraft] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const text = draft ?? String(value);
  const parsed = Number(text);
  const valid = text.trim() !== "" && Number.isInteger(parsed) && parsed >= min && parsed <= max;
  const range = t("settings.numberRange", { min, max });

  const commit = () => {
    if (draft === null) return;
    if (!valid) {
      setShowError(true);
      return;
    }
    if (parsed !== value) onCommit(parsed);
    setDraft(null);
    setShowError(false);
  };

  return (
    <Input
      label={label}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={1}
      value={text}
      onChange={(e) => {
        setDraft(e.target.value);
        setShowError(false);
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(null);
          setShowError(false);
        }
      }}
      errorText={showError ? range : undefined}
      helpText={help ?? range}
      className="max-w-40"
    />
  );
}
