import { useTranslation } from "react-i18next";
import { useEditorStore } from "@store/editor-store";
import { CopyButton } from "./CopyButton";

/**
 * Renders the non-description artefacts (thumbnail text + pinned comment)
 * on the Output page. These stay outside the description because they
 * get pasted into different YouTube surfaces.
 */
export function OutputExtras() {
  const { t } = useTranslation("ui");
  const thumbnailText = useEditorStore((s) => s.thumbnailText);
  const pinnedComment = useEditorStore((s) => s.pinnedComment);

  const hasThumbnail = thumbnailText && thumbnailText.trim() !== "";
  const hasPinned = pinnedComment && pinnedComment.trim() !== "";
  if (!hasThumbnail && !hasPinned) return null;

  return (
    <div className="flex flex-col gap-6">
      {hasThumbnail && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {t("output.thumbnailText")}
            </h3>
            <CopyButton text={thumbnailText} label={t("output.copyThumbnailText")} />
          </div>
          <div className="rounded-lg border border-border bg-surface-1 p-3">
            <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary">
              {thumbnailText}
            </pre>
          </div>
        </section>
      )}

      {hasPinned && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {t("output.pinnedComment")}
            </h3>
            <CopyButton text={pinnedComment} label={t("output.copyPinnedComment")} />
          </div>
          <div className="rounded-lg border border-border bg-surface-1 p-3">
            <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary">
              {pinnedComment}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
