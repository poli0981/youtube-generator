import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Pencil, Trash2 } from "lucide-react";
import { Button } from "@components/ui/Button";
import { ConfirmDialog } from "@components/ui/ConfirmDialog";
import { useEditorStore } from "@store/editor-store";
import { usePresetStore, type GamePreset } from "@store/preset-store";
import { GENRES } from "@config/genres";
import { PresetSaveForm } from "./PresetSaveForm";

interface PresetCardProps {
  preset: GamePreset;
}

export function PresetCard({ preset }: PresetCardProps) {
  const { t } = useTranslation("ui");
  const loadPreset = useEditorStore((s) => s.loadPreset);
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
    });
  };

  const genreDefs = preset.genres
    .map((id) => GENRES.find((g) => g.id === id))
    .filter((g): g is (typeof GENRES)[number] => g !== undefined);

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border border-border-strong bg-surface-2 p-4 shadow-md shadow-black/10 transition-colors hover:border-accent/30">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary">{preset.gameName}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
            {genreDefs.map((g) => (
              <span key={g.id} className="rounded bg-surface-2 px-1.5 py-0.5">
                {g.icon} {t(g.labelKey)}
              </span>
            ))}
            <span>{preset.platform}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="primary" size="sm" onClick={handleLoad}>
            <Upload className="h-3.5 w-3.5" />
            {t("presets.loadPreset")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-3.5 w-3.5 text-danger" />
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

      <PresetSaveForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        editPreset={preset}
      />
    </>
  );
}
