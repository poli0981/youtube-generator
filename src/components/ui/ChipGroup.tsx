import clsx from "clsx";

interface ChipOption {
  id: string;
  label: string;
  icon?: string;
}

interface ChipGroupProps {
  label?: string;
  options: readonly ChipOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ChipGroup({ label, options, value, onChange, className }: ChipGroupProps) {
  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium text-text-secondary">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              value === option.id
                ? "bg-accent text-white"
                : "bg-surface-2 text-text-secondary hover:bg-surface-3 hover:text-text-primary",
            )}
          >
            {option.icon && <span>{option.icon}</span>}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
