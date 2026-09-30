import { useTranslation } from "react-i18next";
import { useEditorStore } from "@store/editor-store";
import { TECH_NOTE_GROUPS } from "@config/tech-note-groups";
import type { TechNote } from "@engine/types";
import { GroupedChecklist } from "./GroupedChecklist";

const optionKey = (id: TechNote) => `editor.techNoteOptions.${id}`;

/**
 * Production / playstyle disclaimers that feed the `▸ 🛠 TECH NOTES`
 * description block. All groups start closed — 24 items across 5 groups is
 * too tall to expand by default; search reaches any of them.
 */
export function TechNotesChecklist() {
  const { t } = useTranslation("ui");
  const selected = useEditorStore((s) => s.techNotes);
  const set = useEditorStore((s) => s.set);

  return (
    <GroupedChecklist
      label={t("editor.techNotes")}
      groups={TECH_NOTE_GROUPS}
      optionKey={optionKey}
      selected={selected}
      onChange={(next) => set("techNotes", next)}
      searchPlaceholder={t("editor.techNoteSearchPlaceholder")}
      emptyText={t("editor.techNoteEmpty")}
    />
  );
}
