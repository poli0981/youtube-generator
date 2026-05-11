import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import clsx from "clsx";
import { useEditorStore } from "@store/editor-store";
import {
  CONTENT_WARNING_GROUPS,
  type ContentWarningGroup,
} from "@config/content-warning-groups";
import type { ContentWarning } from "@engine/types";

/**
 * Replaces the v0.7 `WarningToggles` (2 boolean toggles + small
 * checklist) with a unified, searchable, grouped checklist of ~40
 * content-warning items. Each item maps to an entry in the editor's
 * `contentWarnings` array; checking appends, unchecking removes.
 *
 * Selection order is preserved — the description renders bullets in
 * the order the user picked them.
 */
export function ContentWarningChecklist() {
  const { t } = useTranslation("ui");
  const selected = useEditorStore((s) => s.contentWarnings);
  const set = useEditorStore((s) => s.set);

  const [query, setQuery] = useState("");
  // Groups start collapsed except the one with the most-likely-needed
  // items (Spoilers). Users can search to bypass the collapse anyway.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    spoilers: true,
    photosensitive: false,
    phobias: false,
    mental_health: false,
    sensitive: false,
    horror_specific: false,
  }));

  const trimmedQuery = query.trim().toLowerCase();
  const isFiltering = trimmedQuery.length > 0;

  const filteredGroups = useMemo<ContentWarningGroup[]>(() => {
    if (!isFiltering) return [...CONTENT_WARNING_GROUPS];
    return CONTENT_WARNING_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((id) =>
        t(`editor.contentWarningOptions.${id}`).toLowerCase().includes(trimmedQuery),
      ),
    })).filter((group) => group.items.length > 0);
  }, [t, trimmedQuery, isFiltering]);

  const totalMatching = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);

  function toggleItem(id: ContentWarning) {
    if (selected.includes(id)) {
      set(
        "contentWarnings",
        selected.filter((x) => x !== id),
      );
    } else {
      set("contentWarnings", [...selected, id]);
    }
  }

  function toggleGroup(groupId: string) {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-text-secondary">
          {t("editor.warnings")}
        </span>
        {selected.length > 0 && (
          <span className="text-xs text-text-muted">
            {selected.length} selected
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("editor.contentWarningSearchPlaceholder")}
          className="w-full rounded-md border border-border bg-surface-1 py-1.5 pl-8 pr-7 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isFiltering && totalMatching === 0 ? (
        <p className="py-2 text-center text-xs text-text-muted">
          {t("editor.contentWarningEmpty")}
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {filteredGroups.map((group) => {
            const isOpen = isFiltering || openGroups[group.id];
            const groupSelectedCount = group.items.filter((id) =>
              selected.includes(id),
            ).length;
            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-md border border-border bg-surface-1"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium text-text-secondary hover:bg-surface-2"
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
                    <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
                      {groupSelectedCount}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="grid grid-cols-1 gap-x-3 gap-y-1 border-t border-border bg-surface-1 px-3 py-2 sm:grid-cols-2">
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
                            className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-border text-accent focus:ring-1 focus:ring-accent/40"
                          />
                          <span>{t(`editor.contentWarningOptions.${id}`)}</span>
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
