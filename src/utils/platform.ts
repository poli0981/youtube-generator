// The `typeof` guard keeps this module importable outside a browser
// context (vitest's node environment) — no `window` means no Tauri.
export const IS_TAURI =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
