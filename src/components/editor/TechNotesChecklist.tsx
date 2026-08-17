import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import clsx from "clsx";
import { useEditorStore } from "@store/editor-store";
import { TECH_NOTE_GROUPS, type TechNoteGroup } from "@config/tech-note-groups";
import type { TechNote } from "@engine/types";

/**
 * v0.12 Tech Notes checklist — searchable, collapsible, grouped
 * multi-select for the 24 production / playstyle disclaimers that feed
 * the `▸ 🛠 TECH NOTES` description block. Cloned 1:1 from
 * {@link ContentWarningChecklist} since both share the same UX shape;
 * only the data source (`techNotes` vs `contentWarnings`), groups,
 * and i18n namespace differ.
 *
 * Selection order is preserved so the description renders bullets in
 * the order the user picked them.
 */
export function TechNotesChecklist() {
  const { t } = useTranslation("ui");
  const selected = useEditorStore((s) => s.techNotes);
  const set = useEditorStore((s) => s.set);

  const [query, setQuery] = useState("");
  // Default all groups closed — 24 items across 5 groups is too tall to
  // expand by default. Users with a specific note in mind use search;
  // users browsing pop open the group they care about.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    audio: false,
    video_quality: false,
    recording_issues: false,
    playstyle: false,
    production: false,
  }));

  const trimmedQuery = query.trim().toLowerCase();
  const isFiltering = trimmedQuery.length > 0;

  const filteredGroups = useMemo<TechNoteGroup[]>(() => {
    if (!isFiltering) return [...TECH_NOTE_GROUPS];
    return TECH_NOTE_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((id) =>
        t(`editor.techNoteOptions.${id}`).toLowerCase().includes(trimmedQuery),
      ),
    })).filter((group) => group.items.length > 0);
  }, [t, trimmedQuery, isFiltering]);

  const totalMatching = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);

  function toggleItem(id: TechNote) {
    if (selected.includes(id)) {
      set(
        "techNotes",
        selected.filter((x) => x !== id),
      );
    } else {
      set("techNotes", [...selected, id]);
    }
  }

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-text-secondary text-sm font-medium">{t("editor.techNotes")}</span>
        {selected.length > 0 && (
          <span className="text-text-muted text-xs">{selected.length} selected</span>
        )}
      </div>

      <div className="relative">
        <Search className="text-text-muted pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("editor.techNoteSearchPlaceholder")}
          className="border-border bg-surface-1 text-text-primary placeholder:text-text-muted focus:border-accent w-full rounded-md border py-1.5 pr-7 pl-8 text-sm focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-text-muted hover:text-text-primary absolute top-1/2 right-2 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isFiltering && totalMatching === 0 ? (
        <p className="text-text-muted py-2 text-center text-xs">{t("editor.techNoteEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-1">
          {filteredGroups.map((group) => {
            const isOpen = isFiltering || openGroups[group.id];
            const groupSelectedCount = group.items.filter((id) => selected.includes(id)).length;
            return (
              <div
                key={group.id}
                className="border-border bg-surface-1 overflow-hidden rounded-md border"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="text-text-secondary hover:bg-surface-2 flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-1.5">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    {t(group.labelKey)}
                  </span>
                  {groupSelectedCount > 0 && (
                    <span className="bg-accent/15 text-accent rounded-full px-2 py-0.5 text-[10px] font-medium">
                      {groupSelectedCount}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="border-border bg-surface-1 grid grid-cols-1 gap-x-3 gap-y-1 border-t px-3 py-2 sm:grid-cols-2">
                    {group.items.map((id) => {
                      const checked = selected.includes(id);
                      return (
                        <label
                          key={id}
                          className={clsx(
                            "flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs transition-colors",
                            checked
                              ? "text-text-primary"
                              : "text-text-secondary hover:text-text-primary",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(id)}
                            className="focus:ring-accent/40 border-border text-accent h-3.5 w-3.5 shrink-0 cursor-pointer rounded focus:ring-1"
                          />
                          <span>{t(`editor.techNoteOptions.${id}`)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
