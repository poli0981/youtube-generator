import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Pencil, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { usePresetStore, type GamePreset } from "@store/preset-store";
import { GENRES } from "@config/genres";
import { PresetSaveForm } from "./PresetSaveForm";

interface PresetCardProps {
  preset: GamePreset;
}

export function PresetCard({ preset }: PresetCardProps) {
  const { t } = useTranslation("ui");
  const loadPreset = useEditorStore((s) => s.loadPreset);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const deletePreset = usePresetStore((s) => s.deletePreset);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleLoad = () => {
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
    // v0.21.0: same pattern as PresetSelector — only flip the setting
    // when the preset explicitly carries it, so older presets don't
    // silently reset a user's preference on first load.
    if (preset.showGameCopyright !== undefined) {
      setSetting("showGameCopyright", preset.showGameCopyright);
    }
  };

  const genreDefs = preset.genres
    .map((id) => GENRES.find((g) => g.id === id))
    .filter((g): g is (typeof GENRES)[number] => g !== undefined);

  return (
    <>
      <div className="hover:border-accent/30 border-border-strong bg-surface-2 flex flex-col gap-3 rounded-lg border p-4 shadow-md shadow-black/10 transition-colors sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-text-primary text-sm font-semibold">{preset.gameName}</h3>
          <div className="text-text-muted mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            {genreDefs.map((g) => (
              <span key={g.id} className="bg-surface-2 rounded px-1.5 py-0.5">
                {g.icon} {t(g.labelKey)}
              </span>
            ))}
            <span>{preset.platform}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="primary" size="sm" onClick={handleLoad}>
            <Upload className="h-3.5 w-3.5" />
            {t("presets.loadPreset")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="text-danger h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onConfirm={() => {
          deletePreset(preset.id);
          setShowDelete(false);
        }}
        onCancel={() => setShowDelete(false)}
        title={t("common.delete")}
        message={t("presets.deleteConfirm")}
        confirmLabel={t("common.delete")}
        variant="danger"
      />

      <PresetSaveForm open={showEdit} onClose={() => setShowEdit(false)} editPreset={preset} />
    </>
  );
}
