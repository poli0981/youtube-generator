import { useTranslation } from "react-i18next";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { SOCIAL_FIELDS } from "@config/social-fields";
import { useEditorStore } from "@store/editor-store";
import { validateUrl, validateUrlWithPrefix } from "@utils/validation";
import { FIELD_LIMITS } from "@config/field-limits";

export function SocialEditor() {
  const { t } = useTranslation("ui");
  const social = useEditorStore((s) => s.social);
  const setNested = useEditorStore((s) => s.setNested);

  const donateFields = SOCIAL_FIELDS.filter((f) => f.category === "donate");
  const socialFields = SOCIAL_FIELDS.filter((f) => f.category === "social");

  return (
    <div className="flex flex-col gap-4">
      <span className="text-text-secondary text-sm font-medium">{t("editor.social")}</span>

      <div className="flex flex-col gap-2">
        <span className="text-text-muted text-xs font-medium uppercase">Donate</span>
        {donateFields.map((field) => (
          <ValidatedInput
            key={field.id}
            fieldId={`social.${field.id}`}
            labelKey={field.labelKey}
            label={t(field.labelKey)}
            placeholder={field.urlPrefix || "URL"}
            maxLength={FIELD_LIMITS.URL}
            value={social[field.id] ?? ""}
            onChange={(v) => setNested("social", field.id, v)}
            validate={(v) =>
              field.urlPrefix ? validateUrlWithPrefix(v, field.urlPrefix) : validateUrl(v)
            }
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-text-muted text-xs font-medium uppercase">Social</span>
        {socialFields.map((field) => (
          <ValidatedInput
            key={field.id}
            fieldId={`social.${field.id}`}
            labelKey={field.labelKey}
            label={t(field.labelKey)}
            placeholder={field.urlPrefix || "URL"}
            maxLength={FIELD_LIMITS.URL}
            value={social[field.id] ?? ""}
            onChange={(v) => setNested("social", field.id, v)}
            validate={(v) =>
              field.urlPrefix ? validateUrlWithPrefix(v, field.urlPrefix) : validateUrl(v)
            }
            helpText={
              field.id === "mastodon"
                ? "Full URL including instance, e.g. https://mastodon.social/@user"
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
