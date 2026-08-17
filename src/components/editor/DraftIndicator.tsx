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
    // Show, then hide 2s later. Both transitions go through the timer rather
    // than one synchronous `setShowSaved(true)` on every dependency change,
    // which cost an extra render pass each keystroke-driven update
    // (react-hooks/set-state-in-effect).
    const show = setTimeout(() => setShowSaved(true), 0);
    const hide = setTimeout(() => setShowSaved(false), 2000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [gameName, videoType]);

  if (!showSaved) return null;

  return (
    <span className="text-success flex items-center gap-1 text-xs">
      <Check className="h-3 w-3" />
      {t("editor.draftSaved")}
    </span>
  );
}
