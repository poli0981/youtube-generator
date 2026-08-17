import { useTranslation } from "react-i18next";
import { ClipboardCopy } from "lucide-react";
import { Button } from "@components/ui/Button";
import { useClipboard } from "@hooks/use-clipboard";
import { LimitBlockBanner } from "./LimitBlockBanner";
import type { OutputLimitStatus } from "@engine/limits";

interface CopyAllBarProps {
  /** Exactly what gets copied — the caller decides single vs multi-language. */
  text: string;
  /**
   * Over-limit status of every output contributing to `text`. The bar copies a
   * concatenation, so one offending language blocks the blob.
   */
  status: OutputLimitStatus;
}

/**
 * Sticky "copy everything" bar.
 *
 * Before v0.35.0 this owned its own over-limit check — which skipped tags, and
 * more importantly bailed out entirely when an `extraText` prop was present.
 * That prop was set by exactly one caller: OutputPage, whenever more than one
 * language was selected. So selecting a second language silently turned off
 * every limit check on the primary copy path. The bar no longer decides
 * anything; it renders the status the page computes.
 */
export function CopyAllBar({ text, status }: CopyAllBarProps) {
  const { t } = useTranslation("ui");
  const { copy } = useClipboard();

  return (
    <div className="border-border bg-surface-0 sticky bottom-0 flex flex-col gap-2 border-t px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      <LimitBlockBanner status={status} />
      <div className="flex items-center justify-end">
        <Button
          onClick={() => void copy(text)}
          disabled={status.blocked || !text}
          size="lg"
          className="text-sm sm:text-base"
        >
          <ClipboardCopy className="h-4 w-4" />
          {t("output.copyAll")}
        </Button>
      </div>
    </div>
  );
}
