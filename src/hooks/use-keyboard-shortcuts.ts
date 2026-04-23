import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGeneratedOutput } from "./use-generated-output";
import { useClipboard } from "./use-clipboard";
import toast from "react-hot-toast";

interface ShortcutOptions {
  onToggleHelp: () => void;
}

export function useKeyboardShortcuts({ onToggleHelp }: ShortcutOptions) {
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
      } else if (ctrl && e.key === "/") {
        e.preventDefault();
        onToggleHelp();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, output.title, output.description, copy, onToggleHelp]);
}
