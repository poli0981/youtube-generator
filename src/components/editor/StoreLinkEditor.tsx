import type { ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { Select } from "@components/ui/Select";
import { PLATFORMS } from "@config/platforms";
import { useEditorStore } from "@store/editor-store";
import { validateUrlWithPattern } from "@utils/validation";
import { extractGameNameFromUrl } from "@utils/url-extractors";
import type { StoreLinkType } from "@engine/types";

const STORE_LINK_TYPE_VALUES: readonly StoreLinkType[] = ["paid", "free", "demo"];

export function StoreLinkEditor() {
  const { t } = useTranslation("ui");
  const storeLinks = useEditorStore((s) => s.storeLinks);
  const storeLinkTypes = useEditorStore((s) => s.storeLinkTypes);
  const gameName = useEditorStore((s) => s.gameName);
  const setField = useEditorStore((s) => s.set);
  const setNested = useEditorStore((s) => s.setNested);
  const setStoreLinkType = useEditorStore((s) => s.setStoreLinkType);

  const typeOptions = STORE_LINK_TYPE_VALUES.map((value) => ({
    value,
    label: t(`storeLinkTypes.${value}`),
  }));

  // When a recognised store URL is pasted into any link input AND the
  // Game Name field is still empty, auto-fill it from the URL slug. The
  // toast carries an Undo action so a wrong guess is one click away from
  // being reverted. Never overwrites a non-empty Game Name.
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (gameName.trim()) return;
    const pasted = e.clipboardData.getData("text").trim();
    if (!pasted) return;
    const extracted = extractGameNameFromUrl(pasted);
    if (!extracted) return;

    setField("gameName", extracted);
    toast.custom(
      (item) => (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary shadow">
          <span>{t("editor.toast.urlAutoFilled", { name: extracted })}</span>
          <button
            type="button"
            className="rounded px-2 py-0.5 text-xs font-medium text-accent hover:bg-surface-1"
            onClick={() => {
              setField("gameName", "");
              toast.dismiss(item.id);
            }}
          >
            {t("common.undo")}
          </button>
        </div>
      ),
      { duration: 5000 },
    );
  };

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
                onPaste={handlePaste}
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
