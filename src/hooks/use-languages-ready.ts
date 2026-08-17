import { useEffect, useMemo, useState } from "react";
import { ensureLanguagesLoaded, hasLanguageBundles } from "@i18n/index";
import type { SupportedLanguage } from "@engine/types";

/**
 * Returns true once every requested language has its locale bundles in
 * memory (v0.26 lazy-loaded locales). Until then the caller must render a
 * pending placeholder instead of generating — an unloaded language would
 * otherwise silently produce English fallback output.
 *
 * Resolves to true even when a bundle fails to fetch (offline, stale
 * deploy): `ensureLanguagesLoaded` logs the failure and the app degrades
 * to English rather than hanging the UI.
 */
export function useLanguagesReady(langs: readonly SupportedLanguage[]): boolean {
  const joined = langs.join(",");
  // Stable identity for the requested set — callers pass fresh array
  // literals on every render.
  const key = useMemo(
    () => [...new Set(joined ? joined.split(",") : [])].sort().join(","),
    [joined],
  );
  const [readyKey, setReadyKey] = useState<string | null>(() =>
    langs.every(hasLanguageBundles) ? key : null,
  );

  useEffect(() => {
    const wanted = (key ? key.split(",") : []) as SupportedLanguage[];
    if (wanted.every(hasLanguageBundles)) {
      // Already in memory. Guarded so a re-run with an unchanged key doesn't
      // schedule a redundant render (react-hooks/set-state-in-effect).
      setReadyKey((prev) => (prev === key ? prev : key));
      return;
    }
    let cancelled = false;
    void ensureLanguagesLoaded(wanted).finally(() => {
      if (!cancelled) setReadyKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Comparing against the current key means a late resolve for a
  // superseded language set can never mark the new set ready.
  return readyKey === key;
}
