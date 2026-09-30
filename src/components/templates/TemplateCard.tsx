import { useTranslation } from "react-i18next";
import { LayoutTemplate } from "lucide-react";
import { LibraryCard } from "@components/library/LibraryCard";
import { useTemplateStore, type EditorTemplate } from "@store/template-store";
import { applyTemplate } from "@utils/library-apply";

export function TemplateCard({ template }: { template: EditorTemplate }) {
  const { t, i18n } = useTranslation("ui");
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate);
  const date = new Date(template.createdAt).toLocaleDateString(i18n.language);

  return (
    <LibraryCard
      icon={LayoutTemplate}
      title={template.name}
      meta={`${template.snapshot?.gameName || "—"} · ${date}`}
      applyLabel={t("templates.loadTemplate")}
      onApply={() => void applyTemplate(template)}
      onDelete={() => deleteTemplate(template.id)}
      deleteMessage={t("templates.deleteConfirm")}
    />
  );
}
