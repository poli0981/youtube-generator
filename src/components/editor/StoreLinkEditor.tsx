import { useTranslation } from "react-i18next";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { PLATFORMS } from "@config/platforms";
import { useEditorStore } from "@store/editor-store";
import { validateUrlWithPrefix } from "@utils/validation";

export function StoreLinkEditor() {
  const { t } = useTranslation("ui");
  const storeLinks = useEditorStore((s) => s.storeLinks);
  const setNested = useEditorStore((s) => s.setNested);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-text-secondary">{t("editor.storeLinks")}</span>
      <div className="flex flex-col gap-2">
        {PLATFORMS.map((platform) => (
          <ValidatedInput
            key={platform.id}
            label={platform.label}
            placeholder={platform.urlPrefix}
            value={storeLinks[platform.id] ?? ""}
            onChange={(v) => setNested("storeLinks", platform.id, v)}
            validate={(v) => validateUrlWithPrefix(v, platform.urlPrefix)}
          />
        ))}
      </div>
    </div>
  );
}
