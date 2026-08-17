import { useTranslation } from "react-i18next";
import { Textarea } from "@components/ui/Textarea";
import { useEditorStore } from "@store/editor-store";
import { FIELD_LIMITS } from "@config/field-limits";

export function TimestampEditor() {
  const { t } = useTranslation("ui");
  const timestamps = useEditorStore((s) => s.timestamps);
  const set = useEditorStore((s) => s.set);

  return (
    <Textarea
      label={t("editor.timestamps")}
      maxLength={FIELD_LIMITS.TIMESTAMPS}
      placeholder={t("editor.timestampsPlaceholder")}
      value={timestamps ?? ""}
      onChange={(e) => set("timestamps", e.target.value)}
      rows={4}
    />
  );
}
