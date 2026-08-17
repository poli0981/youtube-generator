import { Copy, Check, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Button } from "@components/ui/Button";
import { useClipboard } from "@hooks/use-clipboard";

interface CopyButtonProps {
  text: string;
  label: string;
  limit?: number;
  fieldLabel?: string;
  /**
   * Disable the button because *some* field in this output is over its limit —
   * not necessarily this one.
   *
   * The rule is all-or-nothing per output: if the description is 200 characters
   * too long, copying the title is blocked too. Copying two of three fields and
   * silently leaving the third behind is how a half-populated video description
   * gets published.
   */
  blocked?: boolean;
}

export function CopyButton({ text, label, limit, fieldLabel, blocked }: CopyButtonProps) {
  const { t } = useTranslation("ui");
  const { copy, copied } = useClipboard();
  const isOver = limit !== undefined && text.length > limit;
  const disabled = !text || blocked;

  return (
    <Button
      variant="ghost"
      size="sm"
      // `useClipboard` still re-checks `limit` as a backstop, for any call site
      // that passes a limit without wiring `blocked`.
      onClick={() => void copy(text, { limit, fieldLabel })}
      disabled={disabled}
      className={clsx((isOver || blocked) && "text-danger hover:bg-surface-2 hover:text-danger")}
      title={
        blocked ? t("output.limits.copyBlocked") : isOver ? `${text.length}/${limit}` : undefined
      }
    >
      {isOver || blocked ? (
        <AlertTriangle className="h-4 w-4" />
      ) : copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? t("output.copied") : label}
    </Button>
  );
}
