import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { useCurrentGeneratorInput } from "@hooks/use-current-generator-input";
import { useLanguagesReady } from "@hooks/use-languages-ready";
import { buildPinnedComment } from "@engine/pinned-comment-builder";
import { GENRES } from "@config/genres";
import type { Genre } from "@engine/types";
import { CopyButton } from "./CopyButton";

/**
 * Renders the non-description artefacts on the Output page:
 *   1. Thumbnail text (creator's free-form idea / copy for the thumbnail)
 *   2. Pinned comment — creator's free-form draft
 *   3. Pinned comment TEMPLATE — engine-generated, opt-in via Settings
 *
 * (1) and (2) stay outside the description because they get pasted into
 * different YouTube surfaces. (3) is independent from (2) by design:
 * creators can copy the template AND keep their freeform draft side by
 * side without either overriding the other.
 */
export function OutputExtras() {
  const { t } = useTranslation("ui");
  const thumbnailText = useEditorStore((s) => s.thumbnailText);
  const pinnedComment = useEditorStore((s) => s.pinnedComment);
  const showPinnedCommentTemplate = useSettingsStore((s) => s.showPinnedCommentTemplate);
  const includeAskNextGame = useSettingsStore((s) => s.pinnedCommentIncludeAskNextGame);
  const includeGenrePlaylist = useSettingsStore((s) => s.pinnedCommentIncludeGenrePlaylist);
  const genrePlaylists = useSettingsStore((s) => s.genrePlaylists);
  const input = useCurrentGeneratorInput();

  // Resolve genre labels via the UI-namespace translator. The pinned-comment
  // builder is config-free by design — labels come in pre-resolved.
  const genreLabels = useMemo(() => {
    const map: Partial<Record<Genre, string>> = {};
    for (const g of GENRES) map[g.id as Genre] = t(g.labelKey);
    return map;
  }, [t]);

  // Lazy-loaded locales (v0.26): the OutputPage flow normally has this
  // language loaded already, but the component is standalone by design —
  // gate it rather than rely on the page.
  const ready = useLanguagesReady([input.language]);

  const templateText = useMemo(() => {
    if (!ready || !showPinnedCommentTemplate) return "";
    const tFn = i18n.getFixedT(input.language, "templates");
    return buildPinnedComment(input, tFn, {
      includeAskNextGame,
      includeGenrePlaylist,
      genrePlaylists,
      genreLabels,
    });
  }, [
    ready,
    showPinnedCommentTemplate,
    input,
    includeAskNextGame,
    includeGenrePlaylist,
    genrePlaylists,
    genreLabels,
  ]);

  const hasThumbnail = thumbnailText && thumbnailText.trim() !== "";
  const hasPinned = pinnedComment && pinnedComment.trim() !== "";
  const hasTemplate = templateText.trim() !== "";
  if (!hasThumbnail && !hasPinned && !hasTemplate) return null;

  return (
    <div className="flex flex-col gap-6">
      {hasThumbnail && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">{t("output.thumbnailText")}</h3>
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
            <h3 className="text-sm font-semibold text-text-primary">{t("output.pinnedComment")}</h3>
            <CopyButton text={pinnedComment} label={t("output.copyPinnedComment")} />
          </div>
          <div className="rounded-lg border border-border bg-surface-1 p-3">
            <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary">
              {pinnedComment}
            </pre>
          </div>
        </section>
      )}

      {hasTemplate && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              {t("output.pinnedCommentTemplate")}
            </h3>
            <CopyButton text={templateText} label={t("output.copyPinnedCommentTemplate")} />
          </div>
          <div className="rounded-lg border border-border bg-surface-1 p-3">
            <pre className="whitespace-pre-wrap font-sans text-sm text-text-secondary">
              {templateText}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
