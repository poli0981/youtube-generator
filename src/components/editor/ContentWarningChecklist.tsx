import { useTranslation } from "react-i18next";
import { useEditorStore } from "@store/editor-store";
import { CONTENT_WARNING_GROUPS } from "@config/content-warning-groups";
import type { ContentWarning } from "@engine/types";
import { GroupedChecklist } from "./GroupedChecklist";

const optionKey = (id: ContentWarning) => `editor.contentWarningOptions.${id}`;

/**
 * The ~40 content warnings, grouped and searchable. Each maps to an entry in
 * the editor's `contentWarnings` array; selection order is preserved so the
 * description lists them in the order they were picked. Spoilers — the group
 * most videos need — starts open.
 */
export function ContentWarningChecklist() {
  const { t } = useTranslation("ui");
  const selected = useEditorStore((s) => s.contentWarnings);
  const set = useEditorStore((s) => s.set);

  return (
    <GroupedChecklist
      label={t("editor.warnings")}
      groups={CONTENT_WARNING_GROUPS}
      optionKey={optionKey}
      selected={selected}
      onChange={(next) => set("contentWarnings", next)}
      searchPlaceholder={t("editor.contentWarningSearchPlaceholder")}
      emptyText={t("editor.contentWarningEmpty")}
      initiallyOpen={["spoilers"]}
    />
  );
}
