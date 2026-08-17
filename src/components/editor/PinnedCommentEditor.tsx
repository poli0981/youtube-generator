import { useTranslation } from "react-i18next";
import { Textarea } from "@components/ui/Textarea";
import { useEditorStore } from "@store/editor-store";
import { FIELD_LIMITS } from "@config/field-limits";

/**
 * Template for the pinned comment a creator posts under their own
 * video. Lives outside the description so the creator can paste it
 * directly into YouTube's comment box.
 */
export function PinnedCommentEditor() {
  const { t } = useTranslation("ui");
  const pinnedComment = useEditorStore((s) => s.pinnedComment);
  const set = useEditorStore((s) => s.set);

  return (
    <Textarea
      label={t("editor.pinnedComment")}
      maxLength={FIELD_LIMITS.LONG_TEXT}
      placeholder={t("editor.pinnedCommentPlaceholder")}
      value={pinnedComment ?? ""}
      onChange={(e) => set("pinnedComment", e.target.value)}
      rows={3}
    />
  );
}
