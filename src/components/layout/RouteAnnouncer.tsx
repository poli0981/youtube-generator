import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { PAGE_TITLE_EVENT } from "@hooks/use-document-title";

/** A navigation whose page never names itself stops waiting after this long. */
const PENDING_MS = 5000;

/**
 * Tells screen readers which page a navigation opened. A single-page app
 * swaps the content without loading a page, so nothing is announced on its
 * own. Focus stays where it was (on the link that was used), so keyboard users
 * carry on from there.
 *
 * Every page names itself through useDocumentTitle, which fires
 * PAGE_TITLE_EVENT — after the commit's effects, so a page rendered in the
 * same commit as the path change is heard, and a lazy page is heard once its
 * chunk arrives and it renders. A title change with no navigation behind it
 * (switching the interface language) stays silent.
 */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState("");
  const pending = useRef(false);
  const lastPath = useRef(pathname);

  useEffect(() => {
    const onTitle = (event: Event) => {
      if (!pending.current || !(event instanceof CustomEvent)) return;
      if (typeof event.detail !== "string") return;
      pending.current = false;
      setMessage(event.detail);
    };
    window.addEventListener(PAGE_TITLE_EVENT, onTitle);
    return () => window.removeEventListener(PAGE_TITLE_EVENT, onTitle);
  }, []);

  useEffect(() => {
    // The first page is announced by the browser's own page load (and
    // Strict Mode's second run of this effect must not count as a visit).
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    pending.current = true;
    const timer = window.setTimeout(() => {
      pending.current = false;
    }, PENDING_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
