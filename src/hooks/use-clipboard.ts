import { useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { logger } from "@utils/logger";

export interface CopyOptions {
  limit?: number;
  fieldLabel?: string;
}

interface UseClipboardReturn {
  copy: (text: string, opts?: CopyOptions) => Promise<boolean>;
  copied: boolean;
}

export function useClipboard(): UseClipboardReturn {
  const { t } = useTranslation("ui");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string, opts?: CopyOptions): Promise<boolean> => {
      if (opts?.limit !== undefined && text.length > opts.limit) {
        toast.error(
          t("output.copy.overLimit", {
            field: opts.fieldLabel ?? t("output.copy.fieldGeneric"),
            count: text.length,
            limit: opts.limit,
          }),
        );
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(t("output.copied"));

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
        return true;
      } catch (e) {
        toast.error(t("output.copy.failed"));
        logger.error("clipboard", "Failed to copy to clipboard", String(e));
        return false;
      }
    },
    [t],
  );

  return { copy, copied };
}
