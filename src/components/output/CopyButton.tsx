import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Button } from "@components/ui/Button";
import { CopyStateIcon } from "@components/icons/animated";
import { useClipboard } from "@hooks/use-clipboard";

interface CopyButtonProps {
  text: string;
  label: string;
  limit?: number;
  fieldLabel?: string;
  /**
   * Disable the button: this field is over its YouTube limit, or Strict Mode
   * is blocking. Since v1.0.0 a field is blocked on its own — a description
   * that is too long no longer stops the (fine) title from being copied; the
   * banner above still names every field that is over.
   */
  blocked?: boolean;
  /** Why it is blocked, shown as the button's tooltip. */
  blockedHint?: string;
}

export function CopyButton({
  text,
  label,
  limit,
  fieldLabel,
  blocked,
  blockedHint,
}: CopyButtonProps) {
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
      title={blocked ? blockedHint : isOver ? `${text.length}/${limit}` : undefined}
    >
      {isOver || blocked ? <AlertTriangle aria-hidden="true" /> : <CopyStateIcon copied={copied} />}
      {copied ? t("output.copied") : label}
    </Button>
  );
}
