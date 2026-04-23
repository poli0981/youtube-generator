import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { VIDEO_TYPES } from "@config/video-types";
import { useEditorStore } from "@store/editor-store";

/**
 * Renders inputs for the extra fields required by the currently selected
 * video type — e.g. "Part Number" for `part`, "Boss Name" for `boss`,
 * "Mod Name" for `mods`. Returns null when the video type has no extras,
 * so the caller doesn't have to conditionally render.
 */
export function ExtraFieldsInput() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

  const currentVideoType = VIDEO_TYPES.find((vt) => vt.id === store.videoType);
  const extraFields: readonly string[] = currentVideoType?.extraFields ?? [];
  if (extraFields.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {extraFields.includes("partNumber") && (
        <Input
          label={t("editor.partNumber")}
          placeholder={t("editor.partNumberPlaceholder")}
          value={store.partNumber ?? ""}
          onChange={(e) => store.set("partNumber", e.target.value)}
        />
      )}
      {extraFields.includes("bossName") && (
        <Input
          label={t("editor.bossName")}
          placeholder={t("editor.bossNamePlaceholder")}
          value={store.bossName ?? ""}
          onChange={(e) => store.set("bossName", e.target.value)}
        />
      )}
      {extraFields.includes("dlcName") && (
        <Input
          label={t("editor.dlcName")}
          placeholder={t("editor.dlcNamePlaceholder")}
          value={store.dlcName ?? ""}
          onChange={(e) => store.set("dlcName", e.target.value)}
        />
      )}
      {extraFields.includes("challengeName") && (
        <Input
          label={t("editor.challengeName")}
          placeholder={t("editor.challengeNamePlaceholder")}
          value={store.challengeName ?? ""}
          onChange={(e) => store.set("challengeName", e.target.value)}
        />
      )}
      {extraFields.includes("modName") && (
        <Input
          label={t("editor.modName")}
          placeholder={t("editor.modNamePlaceholder")}
          value={store.modName ?? ""}
          onChange={(e) => store.set("modName", e.target.value)}
        />
      )}
    </div>
  );
}
