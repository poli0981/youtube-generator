import type { ReactNode } from "react";
import { AnimatePresence, m, type Variants } from "motion/react";
import { Check, Copy, LoaderCircle, Moon, Sun } from "lucide-react";
import clsx from "clsx";
import type { IconComponent } from "./brand";

/**
 * Animated icons. Every effect is decorative and short (< 400 ms), respects
 * the OS "reduce motion" setting through MotionProvider, and never delays the
 * action it decorates.
 */

const swap = {
  initial: { opacity: 0, scale: 0.5, rotate: -45 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  exit: { opacity: 0, scale: 0.5, rotate: 45 },
  transition: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] },
} as const;

function Swap({
  id,
  children,
  className,
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx("relative inline-grid place-items-center", className)} aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.span key={id} className="col-start-1 row-start-1 inline-flex" {...swap}>
          {children}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

/** Copy → check once copied. */
export function CopyStateIcon({ copied, className }: { copied: boolean; className?: string }) {
  return (
    <Swap id={copied ? "check" : "copy"}>
      {copied ? (
        <Check className={clsx("text-success", className)} strokeWidth={2.5} />
      ) : (
        <Copy className={className} />
      )}
    </Swap>
  );
}

/** Sun ↔ moon: shows the theme the toggle will switch TO. */
export function ThemeToggleIcon({
  theme,
  className,
}: {
  theme: "dark" | "light";
  className?: string;
}) {
  return (
    <Swap id={theme}>
      {theme === "dark" ? <Sun className={className} /> : <Moon className={className} />}
    </Swap>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={clsx("animate-spin", className)} aria-hidden="true" />;
}

/** Micro-interactions an icon plays while its parent is hovered or focused. */
export type IconMotion = "wiggle" | "bounce" | "spin" | "pop" | "tilt" | "nudge";

const ICON_MOTION: Record<IconMotion, Variants> = {
  wiggle: {
    rest: { rotate: 0 },
    hover: { rotate: [0, -14, 10, -6, 0], transition: { duration: 0.45 } },
  },
  bounce: { rest: { y: 0 }, hover: { y: [0, -3, 0], transition: { duration: 0.35 } } },
  spin: { rest: { rotate: 0 }, hover: { rotate: 90, transition: { duration: 0.35 } } },
  pop: { rest: { scale: 1 }, hover: { scale: [1, 1.22, 1], transition: { duration: 0.3 } } },
  tilt: {
    rest: { rotate: 0 },
    hover: { rotate: -12, transition: { type: "spring", stiffness: 400, damping: 12 } },
  },
  nudge: { rest: { x: 0 }, hover: { x: [0, 3, 0], transition: { duration: 0.3 } } },
};

/**
 * An icon that animates when an ANCESTOR carrying `initial="rest"
 * whileHover="hover" whileFocus="hover"` (see {@link hoverParent}) is hovered
 * or focused — so the whole nav row or button triggers it, not just the glyph.
 */
export function HoverIcon({
  icon: Icon,
  motion = "pop",
  className,
}: {
  icon: IconComponent;
  motion?: IconMotion;
  className?: string;
}) {
  return (
    <m.span className="inline-flex shrink-0" variants={ICON_MOTION[motion]} aria-hidden="true">
      <Icon className={className} />
    </m.span>
  );
}

/** Spread on the element whose hover/focus should play a child HoverIcon. */
export const hoverParent = {
  initial: "rest",
  animate: "rest",
  whileHover: "hover",
  whileFocus: "hover",
} as const;
