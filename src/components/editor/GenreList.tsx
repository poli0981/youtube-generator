import { useTranslation } from "react-i18next";
import { Command } from "cmdk";
import { Check, Layers, Search } from "lucide-react";
import clsx from "clsx";
import { GENRE_GROUP_IDS, type GenreGroupId } from "@config/genres";
import type { Genre } from "@engine/types";

const itemClass =
  "flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm text-text-primary select-none data-[selected=true]:bg-surface-2 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40";

const headingClass =
  "[&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase";

interface GenreListProps {
  options: readonly { id: Genre; label: string }[];
  selected: readonly Genre[];
  atCapacity: boolean;
  onToggle: (id: Genre) => void;
  onApplyGroup: (groupId: GenreGroupId) => void;
}

/**
 * The searchable genre list inside GenreSelector's popover. A separate,
 * lazily loaded module so the search library only downloads when the list is
 * first opened, not with the Editor.
 */
export default function GenreList({
  options,
  selected,
  atCapacity,
  onToggle,
  onApplyGroup,
}: GenreListProps) {
  const { t } = useTranslation("ui");
  return (
    <Command loop>
      <div className="border-border flex items-center gap-2 border-b px-3">
        <Search className="text-text-muted size-4 shrink-0" aria-hidden="true" />
        <Command.Input
          autoFocus
          placeholder={t("editor.genreSearchPlaceholder")}
          className="text-text-primary placeholder:text-text-muted h-10 w-full bg-transparent text-sm outline-none"
        />
      </div>
      <Command.List className="max-h-72 scrollbar-thin overflow-y-auto p-1">
        <Command.Empty className="text-text-muted py-6 text-center text-sm">
          {t("editor.genreSearchNoResults")}
        </Command.Empty>
        <Command.Group heading={t("editor.genreQuickSets")} className={headingClass}>
          {GENRE_GROUP_IDS.map((groupId) => (
            <Command.Item
              key={groupId}
              value={`set-${groupId} ${t(`editor.genreGroups.${groupId}`)}`}
              onSelect={() => onApplyGroup(groupId)}
              className={itemClass}
            >
              <Layers className="text-text-muted size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{t(`editor.genreGroups.${groupId}`)}</span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading={t("editor.genre")} className={headingClass}>
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <Command.Item
                key={option.id}
                value={`${option.label} ${option.id}`}
                disabled={!isSelected && atCapacity}
                onSelect={() => onToggle(option.id)}
                className={itemClass}
              >
                <span
                  className={clsx(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    isSelected ? "border-accent bg-accent text-accent-fg" : "border-border-strong",
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
              </Command.Item>
            );
          })}
        </Command.Group>
      </Command.List>
    </Command>
  );
}
