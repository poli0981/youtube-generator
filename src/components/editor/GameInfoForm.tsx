import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { PLATFORMS } from "@config/platforms";
import { VIDEO_TYPES } from "@config/video-types";
import { useEditorStore } from "@store/editor-store";

export function GameInfoForm() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

  const currentVideoType = VIDEO_TYPES.find((vt) => vt.id === store.videoType);
  const extraFields: readonly string[] = currentVideoType?.extraFields ?? [];

  const platformOptions = PLATFORMS.map((p) => ({ value: p.id, label: p.label }));

  return (
    <div className="flex flex-col gap-3">
      <Input
        label={t("editor.gameName")}
        placeholder={t("editor.gameNamePlaceholder")}
        value={store.gameName}
        onChange={(e) => store.set("gameName", e.target.value)}
      />
      <Input
        label={t("editor.channelName")}
        placeholder={t("editor.channelNamePlaceholder")}
        value={store.channelName}
        onChange={(e) => store.set("channelName", e.target.value)}
      />
      <Select
        label={t("editor.platform")}
        options={platformOptions}
        value={store.platform}
        onChange={(v) => store.set("platform", v)}
      />
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
    </div>
  );
}
