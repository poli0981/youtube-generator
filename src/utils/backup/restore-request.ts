import { create } from "zustand";
import type { ParsedFile } from "./detect";

/**
 * The file waiting in the restore dialog. Kept apart from the rest of the
 * backup code so the app shell can watch it without loading any of that.
 */
export interface RestoreRequest {
  file: ParsedFile;
  /** Shown in the dialog so it's clear which file this is. */
  fileName: string;
}

interface RestoreDialogState {
  request: RestoreRequest | null;
  open: (request: RestoreRequest) => void;
  close: () => void;
}

export const useRestoreDialog = create<RestoreDialogState>()((set) => ({
  request: null,
  open: (request) => set({ request }),
  close: () => set({ request: null }),
}));
