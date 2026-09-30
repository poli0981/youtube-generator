import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useOutputCopy } from "./use-output-copy";

export interface ShortcutHandlers {
  onToggleHelp: () => void;
  onToggleSidebar: () => void;
  onTogglePalette: () => void;
}

/**
 * App-wide keyboard shortcuts. `mod` is Ctrl, or ⌘ on a Mac — both are
 * accepted everywhere so an external keyboard never matters.
 *
 * The listener is attached once and reads the latest output / handlers from a
 * ref, instead of being torn down and re-added on every keystroke that
 * changes the output.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const navigate = useNavigate();
  const { t } = useTranslation("ui");
  const copyOutput = useOutputCopy();

  const latest = useRef({ handlers, navigate, t, copyOutput });
  useEffect(() => {
    latest.current = { handlers, navigate, t, copyOutput };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { handlers, navigate, t, copyOutput } = latest.current;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (mod && !e.shiftKey && !e.altKey && key === "k") {
        e.preventDefault();
        handlers.onTogglePalette();
      } else if (mod && (e.key === "Enter" || (!e.shiftKey && key === "g"))) {
        e.preventDefault();
        navigate("/output");
      } else if (mod && e.shiftKey && key === "c") {
        e.preventDefault();
        // Same gates as the Output page's Copy All: over-limit or a Strict
        // Mode error means nothing is copied.
        void copyOutput("all");
      } else if (mod && !e.shiftKey && key === "s") {
        // The draft is saved on every change already; this only confirms it
        // (and keeps the browser's "Save page" dialog out of the way).
        e.preventDefault();
        toast.success(t("editor.draftSaved"));
      } else if (mod && !e.shiftKey && key === "b") {
        // VS Code convention: Ctrl/Cmd+B toggles the sidebar.
        e.preventDefault();
        handlers.onToggleSidebar();
      } else if (mod && e.key === "/") {
        e.preventDefault();
        handlers.onToggleHelp();
      } else if (
        // Bare `?` (Shift+/) opens the cheatsheet too. Skip when the
        // user is typing into a form field — `?` is a legitimate
        // character in titles, descriptions, and other inputs.
        e.key === "?" &&
        !mod &&
        !isEditableTarget(e.target)
      ) {
        e.preventDefault();
        handlers.onToggleHelp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

/**
 * True when the keydown target is an input the user might be typing
 * into. Used to gate bare-character shortcuts (e.g. `?`) so they don't
 * hijack normal text entry.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}
