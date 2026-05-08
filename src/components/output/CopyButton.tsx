import { Copy, Check, AlertTriangle } from "lucide-react";
import clsx from "clsx";
import { Button } from "@components/ui/Button";
import { useClipboard } from "@hooks/use-clipboard";

interface CopyButtonProps {
  text: string;
  label: string;
  limit?: number;
  fieldLabel?: string;
}

export function CopyButton({ text, label, limit, fieldLabel }: CopyButtonProps) {
  const { copy, copied } = useClipboard();
  const isOver = limit !== undefined && text.length > limit;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copy(text, { limit, fieldLabel })}
      disabled={!text}
      className={clsx(isOver && "text-danger hover:bg-surface-2 hover:text-danger")}
      title={isOver ? `${text.length}/${limit}` : undefined}
    >
      {isOver ? (
        <AlertTriangle className="h-4 w-4" />
      ) : copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Copied!" : label}
    </Button>
  );
}
