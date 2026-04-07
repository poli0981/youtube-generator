import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { useEditorStore } from "@store/editor-store";

const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "1440p", label: "1440p" },
  { value: "4K", label: "4K" },
];

const FPS_OPTIONS = [
  { value: "30", label: "30 FPS" },
  { value: "60", label: "60 FPS" },
  { value: "120", label: "120 FPS" },
  { value: "144", label: "144 FPS" },
];

export function VideoSettingsForm() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-text-secondary">{t("editor.videoSettings")}</span>
      <div className="grid grid-cols-3 gap-3">
        <Select
          label={t("editor.resolution")}
          options={RESOLUTION_OPTIONS}
          value={store.resolution ?? "1080p"}
          onChange={(v) => store.set("resolution", v)}
        />
        <Select
          label={t("editor.fps")}
          options={FPS_OPTIONS}
          value={store.fps ?? "60"}
          onChange={(v) => store.set("fps", v)}
        />
        <Input
          label={t("editor.graphicsPreset")}
          placeholder="Ultra"
          value={store.graphicsPreset ?? ""}
          onChange={(e) => store.set("graphicsPreset", e.target.value)}
        />
      </div>
    </div>
  );
}
