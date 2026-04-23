import { useTranslation } from "react-i18next";
import { Textarea } from "@components/ui/Textarea";
import { useEditorStore } from "@store/editor-store";

/**
 * Music / sound attribution credit. When non-empty, the engine adds a
 * "🎵 MUSIC / SOUND" section to the generated description.
 */
export function MusicAttributionEditor() {
  const { t } = useTranslation("ui");
  const musicAttribution = useEditorStore((s) => s.musicAttribution);
  const set = useEditorStore((s) => s.set);

  return (
    <Textarea
      label={t("editor.musicAttribution")}
      placeholder={t("editor.musicAttributionPlaceholder")}
      value={musicAttribution ?? ""}
      onChange={(e) => set("musicAttribution", e.target.value)}
      rows={3}
    />
  );
}
