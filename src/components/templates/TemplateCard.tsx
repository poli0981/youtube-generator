import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutTemplate } from "lucide-react";
import { LibraryCard } from "@components/library/LibraryCard";
import { useTemplateStore, type EditorTemplate } from "@store/template-store";
import { applyTemplate } from "@utils/library-apply";
import { TemplateSaveForm } from "./TemplateSaveForm";

export function TemplateCard({ template }: { template: EditorTemplate }) {
  const { t, i18n } = useTranslation("ui");
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate);
  const [showEdit, setShowEdit] = useState(false);
  const date = new Date(template.updatedAt ?? template.createdAt).toLocaleDateString(i18n.language);

  return (
    <>
      <LibraryCard
        icon={LayoutTemplate}
        title={template.name}
        meta={`${template.snapshot?.gameName || "—"} · ${date}`}
        applyLabel={t("templates.loadTemplate")}
        onApply={() => void applyTemplate(template)}
        onEdit={() => setShowEdit(true)}
        onDelete={() => deleteTemplate(template.id)}
        deleteMessage={t("templates.deleteConfirm")}
      />
      <TemplateSaveForm
        open={showEdit}
        onClose={() => setShowEdit(false)}
        editTemplate={template}
      />
    </>
  );
}
