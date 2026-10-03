/**
 * Settings › Appearance › Hide scrollbars (v1.1.0). A class on <html> that
 * globals.css turns into `scrollbar-width: none` everywhere; scrolling itself
 * is untouched. public/theme-init.js sets the same class before first paint —
 * it cannot import this module, so keep the name in step there.
 */
export function applyHideScrollbars(hidden: boolean): void {
  document.documentElement.classList.toggle("hide-scrollbars", hidden);
}
