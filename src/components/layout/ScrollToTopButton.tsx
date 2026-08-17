import { useEffect, useState, type RefObject } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUp } from "lucide-react";
import clsx from "clsx";

interface ScrollToTopButtonProps {
  /** The scrollable container to watch and scroll back to the top. */
  scrollRef: RefObject<HTMLElement>;
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
        "fixed bottom-6 right-6 z-40 flex h-touch w-touch items-center justify-center",
        "rounded-full border border-border bg-surface-1 text-text-primary shadow-lg",
        "transition-opacity duration-200 hover:bg-surface-2",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
