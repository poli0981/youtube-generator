import { useEffect } from "react";

/**
 * Fired on `window` (detail: the page name) whenever a page sets its title.
 * RouteAnnouncer reads it out after a navigation; restoring the previous title
 * on unmount does not fire it, so a page being left is never announced.
 */
export const PAGE_TITLE_EVENT = "ytdescgen:page-title";

/**
 * Sets `document.title` to `"<title> · YTDescGen"` for the lifetime of the
 * component, and restores the previous title on unmount. Per-page titles
 * help with browser-tab readability and OS-level window menus (and feed
 * the OG tag in `index.html` for the root route).
 *
 * Pass the localized page name — e.g. `useDocumentTitle(t("tabs.editor"))`.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · YTDescGen`;
    // A microtask, so listeners hear it after every effect of this commit has
    // run — RouteAnnouncer marks the navigation in one of them.
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent(PAGE_TITLE_EVENT, { detail: title }));
    });
    return () => {
      document.title = previous;
    };
  }, [title]);
}
