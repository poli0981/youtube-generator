import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { useEditorStore } from "@store/editor-store";
import { usePresetStore, type GamePreset } from "@store/preset-store";

interface PresetSaveFormProps {
  open: boolean;
  onClose: () => void;
  editPreset?: GamePreset;
}

export function PresetSaveForm({ open, onClose, editPreset }: PresetSaveFormProps) {
  const { t } = useTranslation("ui");
  const editor = useEditorStore();
  const { addPreset, updatePreset } = usePresetStore();

  const [gameName, setGameName] = useState(editPreset?.gameName ?? editor.gameName);

  const handleSave = () => {
    const data = {
      gameName: gameName.trim() || "Unnamed Game",
      gameNameLocalized: editPreset?.gameNameLocalized ?? { ...editor.gameNameLocalized },
      genres: editPreset?.genres ?? [...editor.genres],
      platform: editPreset?.platform ?? editor.platform,
      storeLinks: editPreset?.storeLinks ?? { ...editor.storeLinks },
      spoilerWarning: editPreset?.spoilerWarning ?? editor.spoilerWarning,
      matureWarning: editPreset?.matureWarning ?? editor.matureWarning,
    };

    if (editPreset) {
      updatePreset(editPreset.id, { ...data });
    } else {
      addPreset(data);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editPreset ? t("presets.editPreset") : t("presets.createNew")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          label={t("editor.gameName")}
          placeholder={t("editor.gameNamePlaceholder")}
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          autoFocus
        />
        <p className="text-xs text-text-muted">
          {editPreset
            ? "Update the game name. Other fields are saved from the editor."
            : "Preset will save your current game name, genre, platform, store links, and warning settings."}
        </p>
      </div>
    </Modal>
  );
}
