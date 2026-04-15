import { useTranslation } from "react-i18next";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { Select } from "@components/ui/Select";
import { PLATFORMS } from "@config/platforms";
import { useEditorStore } from "@store/editor-store";
import { validateUrlWithPattern } from "@utils/validation";
import type { StoreLinkType } from "@engine/types";

const STORE_LINK_TYPE_VALUES: readonly StoreLinkType[] = ["paid", "free", "demo"];

export function StoreLinkEditor() {
  const { t } = useTranslation("ui");
  const storeLinks = useEditorStore((s) => s.storeLinks);
  const storeLinkTypes = useEditorStore((s) => s.storeLinkTypes);
  const setNested = useEditorStore((s) => s.setNested);
  const setStoreLinkType = useEditorStore((s) => s.setStoreLinkType);

  const typeOptions = STORE_LINK_TYPE_VALUES.map((value) => ({
    value,
    label: t(`storeLinkTypes.${value}`),
  }));

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-text-secondary">{t("editor.storeLinks")}</span>
      <div className="flex flex-col gap-2">
        {PLATFORMS.map((platform) => {
          const currentType = storeLinkTypes[platform.id] ?? "paid";
          return (
            <div
              key={platform.id}
              className="grid grid-cols-[1fr_9rem] items-end gap-2"
            >
              <ValidatedInput
                label={platform.label}
                placeholder={platform.urlPrefix}
                value={storeLinks[platform.id] ?? ""}
                onChange={(v) => {
                  const final = v && platform.normalize ? platform.normalize(v) : v;
                  setNested("storeLinks", platform.id, final);
                }}
                validate={(v) => validateUrlWithPattern(v, platform.urlPattern)}
              />
              <Select
                label={t("editor.storeLinkType")}
                value={currentType}
                options={typeOptions}
                onChange={(v) => setStoreLinkType(platform.id, v as StoreLinkType)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
