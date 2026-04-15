import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
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
        {RIG_FIELDS.map((field) => {
          if (field.type === "dropdown_with_version") {
            const raw = rig[field.id] ?? "";
            const [value = "", version = ""] = raw.split("|");

            const commit = (nextValue: string, nextVersion: string) => {
              // Keep the stored form compact: drop the pipe when empty.
              const next =
                !nextValue && !nextVersion ? "" : `${nextValue}|${nextVersion}`;
              setNested("rig", field.id, next);
            };

            return (
              <div key={field.id} className="col-span-2 grid grid-cols-[1fr_auto] gap-2">
                <Select
                  label={t(field.labelKey)}
                  value={value}
                  options={field.options ?? []}
                  onChange={(v) => commit(v, version)}
                />
                <Input
                  label={t("editor.version")}
                  placeholder={field.versionPlaceholder}
                  value={version}
                  onChange={(e) => commit(value, e.target.value)}
                />
              </div>
            );
          }

          return (
            <Input
              key={field.id}
              label={t(field.labelKey)}
              placeholder={field.placeholder}
              value={rig[field.id] ?? ""}
              onChange={(e) => setNested("rig", field.id, e.target.value)}
            />
          );
        })}
      </div>
    </div>
  );
}
