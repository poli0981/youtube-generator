import { useId, type ReactNode } from "react";
import { Switch } from "radix-ui";
import clsx from "clsx";

interface ToggleProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Secondary line under the label, aligned with it. */
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** An on/off switch with its label (and optional description) to the right. */
export function Toggle({
  label,
  checked,
  onChange,
  description,
  disabled,
  className,
}: ToggleProps) {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;
  return (
    <div className={clsx("flex items-start gap-3", disabled && "opacity-55", className)}>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        aria-describedby={descriptionId}
        className={clsx(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent",
          "transition-colors duration-200 disabled:cursor-not-allowed",
          "data-[state=checked]:bg-accent data-[state=unchecked]:bg-surface-3",
        )}
      >
        <Switch.Thumb
          className={clsx(
            "pointer-events-none block size-4 rounded-full bg-white shadow-sm",
            "transition-transform duration-200 ease-[cubic-bezier(0.2,0.9,0.3,1.2)]",
            "translate-x-0.5 data-[state=checked]:translate-x-[1.125rem]",
          )}
        />
      </Switch.Root>
      <div className="min-w-0">
        <label htmlFor={id} className="text-text-primary cursor-pointer text-sm leading-snug">
          {label}
        </label>
        {description && (
          <p id={descriptionId} className="text-text-muted mt-0.5 text-xs leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
