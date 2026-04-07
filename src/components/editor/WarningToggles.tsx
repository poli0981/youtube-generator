import { useTranslation } from "react-i18next";
import { Toggle } from "@components/ui/Toggle";
import { useEditorStore } from "@store/editor-store";

export function WarningToggles() {
  const { t } = useTranslation("ui");
  const spoilerWarning = useEditorStore((s) => s.spoilerWarning);
  const matureWarning = useEditorStore((s) => s.matureWarning);
  const set = useEditorStore((s) => s.set);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-text-secondary">{t("editor.warnings")}</span>
      <Toggle
        label={t("editor.spoilerWarning")}
        checked={spoilerWarning}
        onChange={(v) => set("spoilerWarning", v)}
      />
      <Toggle
        label={t("editor.matureWarning")}
        checked={matureWarning}
        onChange={(v) => set("matureWarning", v)}
      />
    </div>
  );
}
