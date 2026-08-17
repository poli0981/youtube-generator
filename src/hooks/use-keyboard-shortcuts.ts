import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGeneratedOutput } from "./use-generated-output";
import { useClipboard } from "./use-clipboard";
import toast from "react-hot-toast";

interface ShortcutOptions {
  onToggleHelp: () => void;
  onToggleSidebar: () => void;
}

export function useKeyboardShortcuts({ onToggleHelp, onToggleSidebar }: ShortcutOptions) {
  const navigate = useNavigate();
  const output = useGeneratedOutput();
  const { copy } = useClipboard();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && (e.key === "Enter" || e.key === "g" || e.key === "G")) {
        e.preventDefault();
        navigate("/output");
      } else if (ctrl && e.shiftKey && e.key === "C") {
        e.preventDefault();
        copy(`${output.title}\n\n${output.description}`);
      } else if (ctrl && !e.shiftKey && e.key === "s") {
        e.preventDefault();
        toast.success("Draft saved");
      } else if (ctrl && !e.shiftKey && (e.key === "b" || e.key === "B")) {
        // VS Code convention: Ctrl/Cmd+B toggles the sidebar.
        e.preventDefault();
        onToggleSidebar();
      } else if (ctrl && e.key === "/") {
        e.preventDefault();
        onToggleHelp();
      } else if (
        // Bare `?` (Shift+/) opens the cheatsheet too. Skip when the
        // user is typing into a form field — `?` is a legitimate
        // character in titles, descriptions, and other inputs.
        e.key === "?" &&
        !ctrl &&
        !isEditableTarget(e.target)
      ) {
        e.preventDefault();
        onToggleHelp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, output.title, output.description, copy, onToggleHelp, onToggleSidebar]);
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
