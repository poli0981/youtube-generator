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

/**
 * Build-time rendered legal documents (build-plugins/legal-docs.ts). Imported
 * lazily by the Legal Center so the HTML never lands in the main chunk.
 */
declare module "virtual:legal-docs" {
  import type { LegalDocId } from "@config/legal";

  export interface RenderedLegalDoc {
    title: string;
    effective: string | null;
    html: { en?: string; vi?: string };
  }

  export const LEGAL_CONTENT: Record<LegalDocId, RenderedLegalDoc>;
}
