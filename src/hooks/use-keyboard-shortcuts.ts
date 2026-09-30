import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useOutputCopy } from "./use-output-copy";
import { useSaveToHistory } from "./use-save-to-history";

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
  const copyOutput = useOutputCopy();
  const saveToHistory = useSaveToHistory();

  const latest = useRef({ handlers, navigate, copyOutput, saveToHistory });
  useEffect(() => {
    latest.current = { handlers, navigate, copyOutput, saveToHistory };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { handlers, navigate, copyOutput, saveToHistory } = latest.current;
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
        // The draft saves itself on every change; Ctrl/⌘+S keeps a copy of
        // the generated output in History (and the browser's "Save page"
        // dialog out of the way).
        e.preventDefault();
        saveToHistory();
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
