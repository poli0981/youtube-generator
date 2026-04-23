import { useTranslation } from "react-i18next";
import { Textarea } from "@components/ui/Textarea";
import { useEditorStore } from "@store/editor-store";

/**
 * Free-form draft for the thumbnail text overlay. Never lands in the
 * generated description — stored only so the creator (or a collaborating
 * designer) can copy it separately.
 */
export function ThumbnailHelper() {
  const { t } = useTranslation("ui");
  const thumbnailText = useEditorStore((s) => s.thumbnailText);
  const set = useEditorStore((s) => s.set);

  return (
    <Textarea
      label={t("editor.thumbnailText")}
      placeholder={t("editor.thumbnailTextPlaceholder")}
      value={thumbnailText ?? ""}
      onChange={(e) => set("thumbnailText", e.target.value)}
      rows={2}
    />
  );
}
