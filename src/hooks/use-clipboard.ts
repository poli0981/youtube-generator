import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { logger } from "@utils/logger";

interface UseClipboardReturn {
  copy: (text: string) => Promise<void>;
  copied: boolean;
}

export function useClipboard(): UseClipboardReturn {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied!");

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error("Failed to copy");
      logger.error("clipboard", "Failed to copy to clipboard", String(e));
    }
  }, []);

  return { copy, copied };
}
