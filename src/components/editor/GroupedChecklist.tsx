import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Search } from "lucide-react";
import clsx from "clsx";
import { Badge } from "@components/ui/Badge";
import { Input } from "@components/ui/Input";

interface ChecklistGroup<T extends string> {
  id: string;
  labelKey: string;
  items: readonly T[];
}

interface GroupedChecklistProps<T extends string> {
  label: string;
  groups: readonly ChecklistGroup<T>[];
  /** i18n key of one option's label. */
  optionKey: (id: T) => string;
  /** In pick order — the description lists them in that order. */
  selected: readonly T[];
  onChange: (next: T[]) => void;
  searchPlaceholder: string;
  emptyText: string;
  /** Groups expanded on first render. */
  initiallyOpen?: readonly string[];
}

/**
 * A searchable, grouped multi-select: content warnings and tech notes. The
 * two used to be separate 160-line copies of the same markup.
 */
export function GroupedChecklist<T extends string>({
  label,
  groups,
  optionKey,
  selected,
  onChange,
  searchPlaceholder,
  emptyText,
  initiallyOpen = [],
}: GroupedChecklistProps<T>) {
  const { t } = useTranslation("ui");
  const [query, setQuery] = useState("");
  const [openGroups, setOpenGroups] = useState<ReadonlySet<string>>(() => new Set(initiallyOpen));

  const trimmedQuery = query.trim().toLowerCase();
  const isFiltering = trimmedQuery.length > 0;

  const filteredGroups = useMemo(() => {
    if (!isFiltering) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((id) => t(optionKey(id)).toLowerCase().includes(trimmedQuery)),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, optionKey, t, trimmedQuery, isFiltering]);

  const toggleItem = (id: T) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const toggleGroup = (groupId: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <span className="text-text-secondary text-xs font-medium">{label}</span>
        {selected.length > 0 && (
          <Badge tone="accent">{t("editor.selectedCount", { n: selected.length })}</Badge>
        )}
      </div>

      <Input
        type="search"
        aria-label={searchPlaceholder}
        placeholder={searchPlaceholder}
        leading={<Search />}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isFiltering && filteredGroups.length === 0 ? (
        <p className="text-text-muted py-2 text-center text-xs">{emptyText}</p>
      ) : (
        <div className="border-border divide-border rounded-control divide-y overflow-hidden border">
          {filteredGroups.map((group) => {
            const isOpen = isFiltering || openGroups.has(group.id);
            const groupSelectedCount = group.items.filter((id) => selected.includes(id)).length;
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
                  className="text-text-secondary hover:bg-surface-2/60 hover:text-text-primary flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <ChevronRight
                      className={clsx("size-3.5 transition-transform", isOpen && "rotate-90")}
                      aria-hidden="true"
                    />
                    {t(group.labelKey)}
                  </span>
                  {groupSelectedCount > 0 && <Badge tone="accent">{groupSelectedCount}</Badge>}
                </button>
                {isOpen && (
                  <div className="bg-surface-0/50 grid grid-cols-1 gap-x-3 gap-y-0.5 px-3 pt-1 pb-2.5 sm:grid-cols-2">
                    {group.items.map((id) => {
                      const checked = selected.includes(id);
                      return (
                        <label
                          key={id}
                          className={clsx(
                            "flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-1.5 text-xs transition-colors",
                            checked
                              ? "text-text-primary"
                              : "text-text-secondary hover:text-text-primary",
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(id)}
                            className="accent-accent size-3.5 shrink-0 cursor-pointer"
                          />
                          <span>{t(optionKey(id))}</span>
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
