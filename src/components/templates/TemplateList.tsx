import { useTranslation } from "react-i18next";
import { useTemplateStore } from "@store/template-store";
import { TemplateCard } from "./TemplateCard";

export function TemplateList() {
  const { t } = useTranslation("ui");
  const templates = useTemplateStore((s) => s.templates);

  if (templates.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-text-muted">
        {t("templates.emptyState")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}
