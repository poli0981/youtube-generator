/**
 * Generate a RFC 4122 v4 UUID.
 *
 * `crypto.randomUUID()` is the fast path, but it only exists in secure
 * contexts (HTTPS, localhost) and in Chromium 92+. Because `generateId()` runs
 * at module load (e.g. the log store's `CURRENT_SESSION_ID`), an unguarded
 * call would throw during boot wherever it is missing. Fall back to a v4 built
 * on `crypto.getRandomValues`, which every engine the app supports has — and
 * never to `Math.random`, which is not a source of unique IDs.
 */
export function generateId(): string {
  const c = globalThis.crypto;

  if (typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  const bytes = c.getRandomValues(new Uint8Array(16));
  // RFC 4122 §4.4: set the version (4) and variant (10xx) bits.
  // (`?? 0` only satisfies noUncheckedIndexedAccess — index 6/8 always exist.)
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
