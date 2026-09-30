import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { usePresetStore } from "@store/preset-store";
import { applyPreset } from "@utils/library-apply";

/** Fill the game fields from a saved preset (with Undo). */
export function PresetSelector() {
  const { t } = useTranslation("ui");
  const presets = usePresetStore((s) => s.presets);

  if (presets.length === 0) return null;

  const options = [
    { value: "", label: t("presets.selectPreset") },
    ...presets.map((p) => ({ value: p.id, label: p.gameName })),
  ];

  return (
    <Select
      label={t("presets.selectPreset")}
      options={options}
      value=""
      onChange={(id) => {
        const preset = presets.find((p) => p.id === id);
        if (preset) applyPreset(preset);
      }}
    />
  );
}
