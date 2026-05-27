import { useMemo, useState } from "react";
import type { ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { Select } from "@components/ui/Select";
import { PLATFORMS } from "@config/platforms";
import { useEditorStore } from "@store/editor-store";
import { validateUrlWithPattern } from "@utils/validation";
import {
  extractGameNameFromUrl,
  isLinkNameMismatch,
} from "@utils/url-extractors";
import type { StoreLinkType } from "@engine/types";

const STORE_LINK_TYPE_VALUES: readonly StoreLinkType[] = ["paid", "free", "demo"];

interface MismatchInfo {
  host: string;
  suggestedName: string;
  fingerprint: string;
}

export function StoreLinkEditor() {
  const { t } = useTranslation("ui");
  const storeLinks = useEditorStore((s) => s.storeLinks);
  const storeLinkTypes = useEditorStore((s) => s.storeLinkTypes);
  const gameName = useEditorStore((s) => s.gameName);
  const setField = useEditorStore((s) => s.set);
  const setNested = useEditorStore((s) => s.setNested);
  const setStoreLinkType = useEditorStore((s) => s.setStoreLinkType);

  const [dismissedFingerprints, setDismissedFingerprints] = useState<
    ReadonlySet<string>
  >(new Set());

  const typeOptions = STORE_LINK_TYPE_VALUES.map((value) => ({
    value,
    label: t(`storeLinkTypes.${value}`),
  }));

  // Find the first store link whose extracted name doesn't fit the
  // typed Game Name (subset-tolerant check). Iteration order is
  // PLATFORMS order. Dismissed fingerprints are skipped so a chain of
  // mismatches surfaces one at a time.
  const mismatch = useMemo<MismatchInfo | null>(() => {
    const trimmed = gameName.trim();
    if (!trimmed) return null;
    for (const platform of PLATFORMS) {
      const url = (storeLinks[platform.id] ?? "").trim();
      if (!url) continue;
      if (!isLinkNameMismatch(trimmed, url)) continue;
      const suggestedName = extractGameNameFromUrl(url);
      if (!suggestedName) continue;
      const fingerprint = `${trimmed}|${url}`;
      if (dismissedFingerprints.has(fingerprint)) continue;
      let host: string;
      try {
        host = new URL(url).host;
      } catch {
        continue;
      }
      return { host, suggestedName, fingerprint };
    }
    return null;
  }, [gameName, storeLinks, dismissedFingerprints]);

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
      {mismatch && (
        <div className="flex items-start gap-2 rounded-lg border border-warning bg-surface-2 px-3 py-2 text-sm">
          <span className="flex-1 text-text-primary">
            {t("editor.warning.linkNameMismatch", {
              host: mismatch.host,
              suggestedName: mismatch.suggestedName,
              gameName: gameName.trim(),
            })}
          </span>
          <button
            type="button"
            aria-label={t("common.dismiss")}
            className="shrink-0 rounded px-2 py-0.5 text-base leading-none text-text-secondary hover:bg-surface-1"
            onClick={() =>
              setDismissedFingerprints((prev) => {
                const next = new Set(prev);
                next.add(mismatch.fingerprint);
                return next;
              })
            }
          >
            ×
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        {PLATFORMS.map((platform) => {
          const currentType = storeLinkTypes[platform.id] ?? "paid";
          const url = storeLinks[platform.id] ?? "";
          // v0.21.0: the inline `pubDevName` input that previously
          // appeared under the Publisher store link has been promoted
          // to a first-class field in `GameInfoForm`, so it can drive
          // the optional game-copyright description line independently
          // of whether the publisher URL is filled.
          return (
            <div
              key={platform.id}
              className="grid grid-cols-[1fr_9rem] items-end gap-2"
            >
              <ValidatedInput
                label={platform.label}
                placeholder={platform.urlPrefix}
                value={url}
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
