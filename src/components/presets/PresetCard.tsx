import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Gamepad2 } from "lucide-react";
import { LibraryCard } from "@components/library/LibraryCard";
import { usePresetStore, type GamePreset } from "@store/preset-store";
import { GENRES } from "@config/genres";
import { PLATFORMS } from "@config/platforms";
import { applyPreset } from "@utils/library-apply";
import { PresetSaveForm } from "./PresetSaveForm";

export function PresetCard({ preset }: { preset: GamePreset }) {
  const { t } = useTranslation("ui");
  const deletePreset = usePresetStore((s) => s.deletePreset);
  const [showEdit, setShowEdit] = useState(false);

  const genreLabels = (preset.genres ?? [])
    .map((id) => GENRES.find((g) => g.id === id))
    .filter((g): g is (typeof GENRES)[number] => g !== undefined)
    .map((g) => t(g.labelKey));
  const platform = PLATFORMS.find((p) => p.id === preset.platform)?.label ?? preset.platform;

  return (
    <>
      <LibraryCard
        icon={Gamepad2}
        title={preset.gameName}
        meta={[...genreLabels, platform].filter(Boolean).join(" · ")}
        applyLabel={t("presets.loadPreset")}
        onApply={() => applyPreset(preset)}
        onEdit={() => setShowEdit(true)}
        onDelete={() => deletePreset(preset.id)}
        deleteMessage={t("presets.deleteConfirm")}
      />
      <PresetSaveForm open={showEdit} onClose={() => setShowEdit(false)} editPreset={preset} />
    </>
  );
}
