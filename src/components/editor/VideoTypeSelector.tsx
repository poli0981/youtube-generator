import { useTranslation } from "react-i18next";
import { ChipGroup } from "@components/ui/ChipGroup";
import { VIDEO_TYPES } from "@config/video-types";
import { useEditorStore } from "@store/editor-store";

export function VideoTypeSelector() {
  const { t } = useTranslation("ui");
  const videoType = useEditorStore((s) => s.videoType);
  const set = useEditorStore((s) => s.set);

  const options = VIDEO_TYPES.map((vt) => ({
    id: vt.id,
    label: t(vt.labelKey),
    icon: vt.icon,
  }));

  return (
    <ChipGroup
      label={t("editor.videoType")}
      options={options}
      value={videoType}
      onChange={(v) => set("videoType", v as typeof videoType)}
    />
  );
}
