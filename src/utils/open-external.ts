import { IS_TAURI } from "./platform";
import { logger } from "./logger";

const EXTERNAL_SCHEME = /^(https?|mailto|tel):/i;

function isExternalHref(href: string | null | undefined): href is string {
  return !!href && EXTERNAL_SCHEME.test(href);
}

/**
 * Open an external URL from any platform.
 *
 * In a Tauri webview (desktop **and** Android) a plain `<a target="_blank">`
 * does nothing useful — the webview has no tab/window manager. Route through
 * the opener plugin instead, which dispatches the URL to the OS (system browser
 * for http/https, mail client for mailto, dialer for tel). On the web build
 * there is no Tauri runtime, so fall back to a normal new tab.
 */
export async function openExternal(url: string): Promise<void> {
  if (IS_TAURI) {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    } catch (e) {
      logger.error("opener", `Failed to open external URL: ${url}`, String(e));
    }
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Drop `target="_blank"` from an external anchor (see installExternalLinkHandler). */
function stripBlankTarget(el: Element): void {
  if (
    el.tagName === "A" &&
    el.getAttribute("target") === "_blank" &&
    isExternalHref(el.getAttribute("href"))
  ) {
    el.removeAttribute("target");
  }
}

function stripWithin(root: ParentNode): void {
  if (root instanceof Element) stripBlankTarget(root);
  root.querySelectorAll?.('a[target="_blank"]').forEach(stripBlankTarget);
}

/**
 * Make external links work inside a Tauri (especially Android) webview.
 *
 * Two Android problems, both verified on a device:
 *  1. A real tap on `<a target="_blank">` triggers the webview's native
 *     `onCreateWindow`, which Tauri tries to satisfy via the shell plugin's
 *     `open` — and there is no such binary on Android, so it throws an uncaught
 *     "Scoped shell IO error". JS `preventDefault` does NOT stop this native
 *     path, so we remove the `target="_blank"` attribute entirely (links are
 *     re-rendered by React, hence the MutationObserver).
 *  2. Without `target="_blank"`, a click would navigate the app's *own*
 *     webview away from the UI — so we intercept the click in the **capture**
 *     phase (before the webview's default handling) and hand the URL to the
 *     opener plugin, which opens the system browser.
 *
 * No-op on the web build, where native `target="_blank"` already opens a new
 * tab correctly.
 */
export function installExternalLinkHandler(): void {
  if (!IS_TAURI) return;

  // React mounts/re-renders links after this runs, so strip on every change.
  stripWithin(document);
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node instanceof Element) stripWithin(node);
      });
    }
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Capture phase: run before the webview's own navigation / new-window logic.
  document.addEventListener(
    "click",
    (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a") ?? null;
      const href = anchor?.getAttribute("href") ?? null;
      if (!isExternalHref(href)) return;
      e.preventDefault();
      void openExternal(href);
    },
    true,
  );
}
