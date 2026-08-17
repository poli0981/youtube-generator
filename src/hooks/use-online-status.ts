import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getSnapshot(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/** SSR / non-browser: assume online, since nothing here gates core features. */
function getServerSnapshot(): boolean {
  return true;
}

/**
 * Track the browser's connectivity. Returns `true` when online.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect`: connectivity is
 * an external store, and the hand-rolled version had to re-read `navigator`
 * inside the effect to close the gap between the initial render and the
 * listeners attaching — a synchronous `setState` in an effect, which costs an
 * extra render pass on every mount and is what
 * `react-hooks/set-state-in-effect` exists to catch. Subscribing properly
 * removes the gap instead of patching it.
 *
 * Note: `navigator.onLine` only reports the OS/browser link state, not whether
 * the wider internet is reachable — which is exactly right here, since the app
 * is fully client-side and "online" only gates lazy locale fetches + external
 * links, never core functionality.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
