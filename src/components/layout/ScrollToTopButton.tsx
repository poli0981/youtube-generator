import { useEffect, useState, type RefObject } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, m } from "motion/react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopButtonProps {
  /**
   * The scrollable container to watch and scroll back to the top. React 19
   * types `useRef<T>(null)` as `RefObject<T | null>` — the ref genuinely is
   * null before the element mounts.
   */
  scrollRef: RefObject<HTMLElement | null>;
}

/** Scroll distance (px) past which the button appears. */
const SHOW_AFTER_PX = 600;

/**
 * Floating "back to top" button in the bottom-left corner of the page area
 * (bottom-right is where pages keep their primary actions and toasts). It
 * appears once `<main>` is scrolled past {@link SHOW_AFTER_PX}.
 */
export function ScrollToTopButton({ scrollRef }: ScrollToTopButtonProps) {
  const { t } = useTranslation("ui");
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    const update = () => {
      setVisible(el.scrollTop > SHOW_AFTER_PX);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    // Re-evaluate on mount and whenever the route changes — the same
    // <main> persists across pages.
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, location.pathname]);

  function scrollToTop() {
    const el = scrollRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    el.focus({ preventScroll: true });
  }

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          type="button"
          onClick={scrollToTop}
          aria-label={t("common.scrollToTop")}
          initial={{ opacity: 0, y: 8, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.9 }}
          transition={{ duration: 0.16 }}
          whileHover={{ y: -2 }}
          className="border-border bg-surface-1/90 text-text-secondary hover:text-text-primary shadow-pop absolute bottom-4 left-4 z-20 flex size-10 cursor-pointer items-center justify-center rounded-full border backdrop-blur-md"
        >
          <ArrowUp className="size-4" aria-hidden="true" />
        </m.button>
      )}
    </AnimatePresence>
  );
}
