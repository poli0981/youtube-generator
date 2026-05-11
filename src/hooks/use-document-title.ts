import { useEffect } from "react";

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
    return () => {
      document.title = previous;
    };
  }, [title]);
}
