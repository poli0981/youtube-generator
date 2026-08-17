import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { usePresetStore } from "@store/preset-store";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";

export function PresetSelector() {
  const { t } = useTranslation("ui");
  const presets = usePresetStore((s) => s.presets);
  const loadPreset = useEditorStore((s) => s.loadPreset);
  const setSetting = useSettingsStore((s) => s.setSetting);

  if (presets.length === 0) return null;

  const options = [
    { value: "", label: `-- ${t("presets.selectPreset")} --` },
    ...presets.map((p) => ({ value: p.id, label: p.gameName })),
  ];

  const handleSelect = (id: string) => {
    if (!id) return;
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    loadPreset({
      gameName: preset.gameName,
      gameNameLocalized: preset.gameNameLocalized ? { ...preset.gameNameLocalized } : {},
      genres: [...preset.genres],
      platform: preset.platform,
      storeLinks: { ...preset.storeLinks },
      spoilerWarning: preset.spoilerWarning,
      matureWarning: preset.matureWarning,
      pubDevName: preset.pubDevName ?? "",
    });
    // v0.21.0: pull the per-preset toggle into the global setting so the
    // description re-renders with the right credit obligation. Missing
    // means "leave the user's setting alone" — older presets don't carry
    // this field.
    if (preset.showGameCopyright !== undefined) {
      setSetting("showGameCopyright", preset.showGameCopyright);
    }
  };

  return (
    <Select label={t("presets.selectPreset")} options={options} value="" onChange={handleSelect} />
  );
}
