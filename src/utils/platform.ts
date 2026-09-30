// The `typeof` guard keeps this module importable outside a browser
// context (vitest's node environment) — no `window` means no Tauri.
export const IS_TAURI = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// True inside the Android WebView. On Android, Tauri still injects
// `__TAURI_INTERNALS__` (so `IS_TAURI` is true), but the desktop file-save
// dialog + `std::fs` write to an arbitrary path is unreliable under Android's
// scoped storage. Use this to route file EXPORT through the in-WebView blob
// download instead. Desktop and web both report false here, so existing
// branches are unaffected. iOS is out of scope (we only ship Android).
export const IS_MOBILE = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

// Apple keyboards label the modifier ⌘ where everyone else says Ctrl, and the
// shortcuts listen for `metaKey || ctrlKey` either way — this only decides
// how a shortcut is SPELLED in the UI.
export const IS_MAC =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
