import { useEffect, useState } from "react";

function readOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/**
 * Track the browser's connectivity. Returns `true` when online.
 *
 * SSR/Tauri-safe (guards `navigator` / `window`). Re-syncs once on mount in
 * case the status flipped between the initial `useState` read and the effect
 * attaching. Mirrors the add/remove-listener shape of
 * {@link import("@hooks/use-global-error-handler").useGlobalErrorHandler}.
 *
 * Note: `navigator.onLine` only reports the OS/browser link state, not whether
 * the wider internet is reachable — which is exactly right here, since the app
 * is fully client-side and "online" only gates lazy locale fetches + external
 * links, never core functionality.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(readOnline);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    setOnline(readOnline());
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return online;
}
