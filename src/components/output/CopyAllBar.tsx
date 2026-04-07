import { useTranslation } from "react-i18next";
import { ClipboardCopy } from "lucide-react";
import { Button } from "@components/ui/Button";
import { useGeneratedOutput } from "@hooks/use-generated-output";
import { useClipboard } from "@hooks/use-clipboard";

export function CopyAllBar() {
  const { t } = useTranslation("ui");
  const output = useGeneratedOutput();
  const { copy } = useClipboard();

  const handleCopyAll = () => {
    const combined = `${output.title}\n\n${output.description}`;
    copy(combined);
  };

  return (
    <div className="sticky bottom-0 flex items-center justify-end border-t border-border bg-surface-0 px-4 py-3">
      <Button onClick={handleCopyAll} size="lg">
        <ClipboardCopy className="h-4 w-4" />
        {t("output.copyAll")}
      </Button>
    </div>
  );
}
