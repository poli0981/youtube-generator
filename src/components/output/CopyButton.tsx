import { Copy, Check } from "lucide-react";
import { Button } from "@components/ui/Button";
import { useClipboard } from "@hooks/use-clipboard";

interface CopyButtonProps {
  text: string;
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const { copy, copied } = useClipboard();

  return (
    <Button variant="ghost" size="sm" onClick={() => copy(text)} disabled={!text}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied!" : label}
    </Button>
  );
}
