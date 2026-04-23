import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { PLATFORMS } from "@config/platforms";
import { useEditorStore } from "@store/editor-store";

/**
 * Core identity fields for the video (game name, channel, platform).
 * Video-type-specific extra fields (partNumber, bossName, …) live in
 * ExtraFieldsInput so they group with the video-type picker.
 */
export function GameInfoForm() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

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
    </div>
  );
}
