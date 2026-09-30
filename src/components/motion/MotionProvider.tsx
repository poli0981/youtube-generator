import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

/**
 * Motion's feature bundle (animations, layout, gestures) arrives after first
 * paint instead of in the initial download: `m.*` components render their
 * final state immediately and start animating once it lands. `strict` makes a
 * stray `motion.*` import (which would pull the full bundle eagerly) throw in
 * development.
 */
const loadFeatures = () => import("./features").then((mod) => mod.default);

/** Motion setup for the whole app. Honours the OS "reduce motion" setting. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
