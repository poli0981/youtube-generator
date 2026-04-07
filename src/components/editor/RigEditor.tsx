import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { RIG_FIELDS } from "@config/rig-fields";
import { useEditorStore } from "@store/editor-store";

export function RigEditor() {
  const { t } = useTranslation("ui");
  const rig = useEditorStore((s) => s.rig);
  const setNested = useEditorStore((s) => s.setNested);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-text-secondary">{t("editor.rig")}</span>
      <div className="grid grid-cols-2 gap-2">
        {RIG_FIELDS.map((field) => (
          <Input
            key={field.id}
            label={t(field.labelKey)}
            placeholder={field.placeholder}
            value={rig[field.id] ?? ""}
            onChange={(e) => setNested("rig", field.id, e.target.value)}
          />
        ))}
      </div>
    </div>
  );
}
