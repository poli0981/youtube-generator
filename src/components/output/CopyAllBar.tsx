import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ClipboardCopy } from "lucide-react";
import { Button } from "@components/ui/Button";
import { useGeneratedOutput } from "@hooks/use-generated-output";
import { useClipboard } from "@hooks/use-clipboard";
import { YT_LIMITS } from "@engine/types";

interface CopyAllBarProps {
  extraText?: string;
}

export function CopyAllBar({ extraText }: CopyAllBarProps) {
  const { t } = useTranslation("ui");
  const output = useGeneratedOutput();
  const { copy } = useClipboard();

  const handleCopyAll = () => {
    if (extraText) {
      copy(extraText);
      return;
    }
    const overflows: string[] = [];
    if (output.title.length > YT_LIMITS.TITLE_MAX) {
      overflows.push(
        t("output.copy.overLimit", {
          field: t("output.title"),
          count: output.title.length,
          limit: YT_LIMITS.TITLE_MAX,
        }),
      );
    }
    if (output.description.length > YT_LIMITS.DESCRIPTION_MAX) {
      overflows.push(
        t("output.copy.overLimit", {
          field: t("output.description"),
          count: output.description.length,
          limit: YT_LIMITS.DESCRIPTION_MAX,
        }),
      );
    }
    if (overflows.length > 0) {
      toast.error(overflows.join("\n"));
      return;
    }
    copy(`${output.title}\n\n${output.description}`);
  };

  return (
    <div className="sticky bottom-0 flex items-center justify-end border-t border-border bg-surface-0 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
      <Button onClick={handleCopyAll} size="lg" className="text-sm sm:text-base">
        <ClipboardCopy className="h-4 w-4" />
        {t("output.copyAll")}
      </Button>
    </div>
  );
}
