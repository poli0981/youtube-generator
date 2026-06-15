/**
 * Generate a RFC 4122 v4 UUID.
 *
 * `crypto.randomUUID()` is the fast path, but it only exists in Chrome/WebView
 * **92+** — older Android System WebViews (e.g. the Chromium 91 that ships with
 * some emulator images, or any device whose WebView hasn't been updated) don't
 * have it. Because `generateId()` runs at module load (e.g. the log store's
 * `CURRENT_SESSION_ID`), an unguarded `crypto.randomUUID()` would throw during
 * boot and black-screen the whole app on those WebViews. Fall back to a manual
 * v4 built on `crypto.getRandomValues` (present since Chrome 11), and finally
 * `Math.random` only if even that is missing.
 */
export function generateId(): string {
  const c: Crypto | undefined =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  // RFC 4122 §4.4: set the version (4) and variant (10xx) bits.
  // (`?? 0` only satisfies noUncheckedIndexedAccess — index 6/8 always exist.)
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
