import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Checkbox } from "@components/ui/Checkbox";
import { editorDataOf, useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { usePresetStore, type GamePreset } from "@store/preset-store";
import { presetFieldsFromEditor } from "@utils/library-apply";
import { FIELD_LIMITS } from "@config/field-limits";

interface PresetSaveFormProps {
  open: boolean;
  onClose: () => void;
  editPreset?: GamePreset;
}

/**
 * Create a preset from the editor's game fields, or rename / update one.
 * Mounted only while open, so it always starts from the preset as it is now.
 */
export function PresetSaveForm(props: PresetSaveFormProps) {
  return props.open ? <PresetSaveFormBody {...props} /> : null;
}

function PresetSaveFormBody({ onClose, editPreset }: PresetSaveFormProps) {
  const { t } = useTranslation("ui");
  const formId = useId();
  const addPreset = usePresetStore((s) => s.addPreset);
  const updatePreset = usePresetStore((s) => s.updatePreset);
  const [gameName, setGameName] = useState(
    editPreset?.gameName ?? useEditorStore.getState().gameName,
  );
  const [fromEditor, setFromEditor] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const fields = presetFieldsFromEditor(editorDataOf(useEditorStore.getState()));
    const name = gameName.trim() || fields.gameName.trim() || t("presets.unnamed");
    const showGameCopyright = useSettingsStore.getState().showGameCopyright;
    if (editPreset) {
      updatePreset(editPreset.id, {
        ...(fromEditor ? { ...fields, showGameCopyright } : {}),
        gameName: name,
      });
      toast.success(t("presets.updated", { name }));
    } else {
      addPreset({ ...fields, gameName: name, showGameCopyright });
      toast.success(t("presets.saved", { name }));
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editPreset ? t("presets.editPreset") : t("presets.createNew")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={save} className="flex flex-col gap-3">
        <Input
          label={t("editor.gameName")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder={t("editor.gameNamePlaceholder")}
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          autoFocus
        />
        {editPreset ? (
          <Checkbox
            checked={fromEditor}
            onChange={setFromEditor}
            label={
              <span className="flex flex-col gap-0.5">
                <span className="text-text-primary text-sm">{t("presets.updateFromEditor")}</span>
                <span className="text-text-muted text-xs">{t("presets.saveHint")}</span>
              </span>
            }
          />
        ) : (
          <p className="text-text-muted text-xs">{t("presets.saveHint")}</p>
        )}
      </form>
    </Modal>
  );
}
