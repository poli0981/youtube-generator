import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { useEditorStore } from "@store/editor-store";

export function DraftIndicator() {
  const { t } = useTranslation("ui");
  const [showSaved, setShowSaved] = useState(false);
  const gameName = useEditorStore((s) => s.gameName);
  const videoType = useEditorStore((s) => s.videoType);

  useEffect(() => {
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [gameName, videoType]);

  if (!showSaved) return null;

  return (
    <span className="flex items-center gap-1 text-xs text-success">
      <Check className="h-3 w-3" />
      {t("editor.draftSaved")}
    </span>
  );
}
