import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { SOCIAL_FIELDS } from "@config/social-fields";
import { useEditorStore } from "@store/editor-store";

export function SocialEditor() {
  const { t } = useTranslation("ui");
  const social = useEditorStore((s) => s.social);
  const setNested = useEditorStore((s) => s.setNested);

  const donateFields = SOCIAL_FIELDS.filter((f) => f.category === "donate");
  const socialFields = SOCIAL_FIELDS.filter((f) => f.category === "social");

  return (
    <div className="flex flex-col gap-4">
      <span className="text-sm font-medium text-text-secondary">{t("editor.social")}</span>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase text-text-muted">Donate</span>
        {donateFields.map((field) => (
          <Input
            key={field.id}
            label={t(field.labelKey)}
            placeholder={field.urlPrefix || "URL"}
            value={social[field.id] ?? ""}
            onChange={(e) => setNested("social", field.id, e.target.value)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase text-text-muted">Social</span>
        {socialFields.map((field) => (
          <Input
            key={field.id}
            label={t(field.labelKey)}
            placeholder={field.urlPrefix || "URL"}
            value={social[field.id] ?? ""}
            onChange={(e) => setNested("social", field.id, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
}
