import { useEffect, useState, type RefObject } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUp } from "lucide-react";
import clsx from "clsx";

interface ScrollToTopButtonProps {
  /** The scrollable container to watch and scroll back to the top. */
  /**
   * React 19 types `useRef<T>(null)` as `RefObject<T | null>` rather than
   * `RefObject<T>` — the ref genuinely is null before the element mounts, and
   * the old type quietly lied about it. Matching that here rather than casting
   * at the call site keeps the null-check below honest.
   */
  scrollRef: RefObject<HTMLElement | null>;
}

/** Scroll distance (px) past which the button fades in. */
const SHOW_AFTER_PX = 300;

/**
 * Floating "back to top" button, fixed to the bottom-right of the
 * viewport. Fades in once the app's scroll container is scrolled past
 * {@link SHOW_AFTER_PX} and smooth-scrolls back on click.
 *
 * The scroll container is the `<main>` element (see AppShell), not the
 * window — so the listener and `scrollTo` both target the passed ref.
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
    // <main> persists across tabs, so scrollTop does not reset itself.
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, location.pathname]);

  function scrollToTop() {
    const el = scrollRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t("common.scrollToTop")}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={clsx(
        "h-touch w-touch fixed right-6 bottom-6 z-40 flex items-center justify-center",
        "border-border bg-surface-1 text-text-primary rounded-full border shadow-lg",
        "hover:bg-surface-2 transition-opacity duration-200",
        "focus-visible:ring-accent focus:outline-none focus-visible:ring-2",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
