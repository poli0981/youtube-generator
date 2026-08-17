/// <reference types="vite/client" />

/**
 * File System Access API — `showSaveFilePicker` is not in TypeScript 5.9's
 * `lib.dom`, but `FileSystemFileHandle` and `FileSystemWritableFileStream` are,
 * so only the `Window` method needs declaring.
 *
 * Optional on purpose: it is absent in Firefox, Safari and the Android WebView,
 * and `src/utils/file-ops.ts` feature-detects it before use.
 */
interface SaveFilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: SaveFilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
}

interface Window {
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
}
