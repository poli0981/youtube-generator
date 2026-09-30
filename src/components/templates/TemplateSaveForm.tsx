import { useId, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Checkbox } from "@components/ui/Checkbox";
import { editorDataOf, useEditorStore } from "@store/editor-store";
import { useTemplateStore, type EditorTemplate } from "@store/template-store";
import { FIELD_LIMITS } from "@config/field-limits";

interface TemplateSaveFormProps {
  open: boolean;
  onClose: () => void;
  editTemplate?: EditorTemplate;
}

/**
 * Save the whole editor form as a template (every field — templates saved
 * before v1.0.0 kept only part of it), or rename / refresh one. Mounted only
 * while open, so it always starts from the template as it is now.
 */
export function TemplateSaveForm(props: TemplateSaveFormProps) {
  return props.open ? <TemplateSaveFormBody {...props} /> : null;
}

function TemplateSaveFormBody({ onClose, editTemplate }: TemplateSaveFormProps) {
  const { t } = useTranslation("ui");
  const formId = useId();
  const addTemplate = useTemplateStore((s) => s.addTemplate);
  const updateTemplate = useTemplateStore((s) => s.updateTemplate);
  const [name, setName] = useState(editTemplate?.name ?? "");
  const [fromEditor, setFromEditor] = useState(false);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const snapshot = structuredClone(editorDataOf(useEditorStore.getState()));
    const finalName = name.trim() || snapshot.gameName.trim() || t("templates.unnamed");
    if (editTemplate) {
      updateTemplate(editTemplate.id, {
        name: finalName,
        snapshot: fromEditor ? snapshot : undefined,
      });
      toast.success(t("templates.updated", { name: finalName }));
    } else {
      addTemplate(finalName, snapshot);
      toast.success(t("templates.savedAs", { name: finalName }));
    }
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={editTemplate ? t("templates.editTemplate") : t("templates.saveAsTemplate")}
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
          label={t("templates.templateName")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder={t("templates.templateNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {editTemplate ? (
          <Checkbox
            checked={fromEditor}
            onChange={setFromEditor}
            label={
              <span className="flex flex-col gap-0.5">
                <span className="text-text-primary text-sm">{t("templates.updateFromEditor")}</span>
                <span className="text-text-muted text-xs">{t("templates.saveHint")}</span>
              </span>
            }
          />
        ) : (
          <p className="text-text-muted text-xs">{t("templates.saveHint")}</p>
        )}
      </form>
    </Modal>
  );
}
