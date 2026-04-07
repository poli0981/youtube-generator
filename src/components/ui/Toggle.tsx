import clsx from "clsx";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function Toggle({ label, checked, onChange, className }: ToggleProps) {
  return (
    <label className={clsx("flex cursor-pointer items-center gap-3", className)}>
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50",
          checked ? "bg-accent" : "bg-surface-3",
        )}
      >
        <span
          className={clsx(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}
