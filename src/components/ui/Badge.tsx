import type { HTMLAttributes } from "react";
import clsx from "clsx";
import { IS_MAC } from "@utils/platform";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-text-secondary border-border",
  accent: "bg-accent-muted text-accent border-transparent",
  success: "bg-success/12 text-success border-transparent",
  warning: "bg-warning/14 text-warning border-transparent",
  danger: "bg-danger/12 text-danger border-transparent",
  info: "bg-info/12 text-info border-transparent",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Small status / count label. */
export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "tabular inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[0.6875rem] font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Keyboard key cap, e.g. <Kbd>Ctrl</Kbd>. */
export function Kbd({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={clsx(
        "border-border bg-surface-2 text-text-secondary inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-b-2 px-1 font-sans text-[0.6875rem] font-medium",
        className,
      )}
      {...props}
    />
  );
}

const KEY_NAMES: Record<string, string> = IS_MAC
  ? { mod: "⌘", shift: "⇧", alt: "⌥", enter: "↵", esc: "Esc" }
  : { mod: "Ctrl", shift: "Shift", alt: "Alt", enter: "Enter", esc: "Esc" };

/** Spell a key the way the user's keyboard labels it ("mod" → ⌘ or Ctrl). */
export function keyName(key: string): string {
  return KEY_NAMES[key] ?? key;
}

/** A key combination as key caps, e.g. ["mod", "K"] → ⌘ K / Ctrl K. */
export function ShortcutKeys({ keys, className }: { keys: readonly string[]; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-0.5", className)}>
      {keys.map((key) => (
        <Kbd key={key}>{keyName(key)}</Kbd>
      ))}
    </span>
  );
}
