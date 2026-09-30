import { useTranslation } from "react-i18next";
import { LayoutTemplate } from "lucide-react";
import { EmptyState } from "@components/ui/EmptyState";
import { LibraryList } from "@components/library/LibraryCard";
import { useTemplateStore } from "@store/template-store";
import { TemplateCard } from "./TemplateCard";

export function TemplateList() {
  const { t } = useTranslation("ui");
  const templates = useTemplateStore((s) => s.templates);

  return (
    <LibraryList
      hint={t("templates.saveHint")}
      empty={
        templates.length === 0 ? (
          <EmptyState icon={LayoutTemplate} title={t("templates.emptyState")} />
        ) : undefined
      }
    >
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </LibraryList>
  );
}
