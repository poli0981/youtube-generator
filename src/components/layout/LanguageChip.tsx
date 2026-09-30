import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import type { SupportedLanguage } from "@engine/types";
import { Tooltip } from "@components/ui/Tooltip";

interface LanguageChipProps {
  value: string;
  onChange: (language: SupportedLanguage) => void;
  /** Accessible name and tooltip. */
  label: string;
  /** Icon or short text before the language code. */
  prefix?: ReactNode;
  className?: string;
}

/**
 * A compact language switch: the chip shows the language code, and a native
 * <select> laid invisibly over it does the picking — the platform's own list
 * (a proper picker on phones), type-ahead and keyboard handling for free,
 * without a menu library in the first download.
 */
export function LanguageChip({ value, onChange, label, prefix, className }: LanguageChipProps) {
  return (
    <Tooltip content={label}>
      <label
        className={clsx(
          "border-border text-text-secondary hover:border-border-strong hover:text-text-primary relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors",
          "focus-within:border-accent focus-within:ring-accent/30 focus-within:ring-2",
          className,
        )}
      >
        {prefix}
        <span aria-hidden="true">{value.toUpperCase()}</span>
        <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value as SupportedLanguage)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.nativeName} ({lang.id})
            </option>
          ))}
        </select>
      </label>
    </Tooltip>
  );
}
