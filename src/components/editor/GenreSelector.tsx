import { lazy, Suspense, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import clsx from "clsx";
import { GENRES, GENRE_GROUPS, type GenreGroupId } from "@config/genres";
import { GENRES_WITHOUT_GRAPHICS_SETTINGS } from "@config/graphics-settings";
import { useEditorStore } from "@store/editor-store";
import { MAX_GENRES, type Genre } from "@engine/types";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "@components/ui/Popover";
import { Banner } from "@components/ui/Banner";
import { Button } from "@components/ui/Button";
import { Spinner } from "@components/icons/animated";

const GenreList = lazy(() => import("./GenreList"));

/**
 * Up to {@link MAX_GENRES} genres: the picked ones as removable chips, the
 * rest in a searchable list. Replaces a wall of 42 always-visible chips that
 * pushed "Game name" below the fold.
 */
export function GenreSelector() {
  const { t, i18n } = useTranslation("ui");
  const labelId = useId();
  const genres = useEditorStore((s) => s.genres);
  const skipGraphicsSettings = useEditorStore((s) => s.skipGraphicsSettings);
  const set = useEditorStore((s) => s.set);
  const [open, setOpen] = useState(false);
  // Session-local dismissal so the hint doesn't keep popping up after the
  // user has chosen "Keep".
  const [hintDismissed, setHintDismissed] = useState(false);

  const options = useMemo(
    () =>
      GENRES.map((g) => ({ id: g.id as Genre, label: t(g.labelKey) })).sort((a, b) =>
        a.label.localeCompare(b.label, i18n.language),
      ),
    [t, i18n.language],
  );
  const labelOf = (id: Genre) => options.find((o) => o.id === id)?.label ?? id;
  const atCapacity = genres.length >= MAX_GENRES;

  const toggle = (id: Genre) => {
    if (genres.includes(id))
      set(
        "genres",
        genres.filter((g) => g !== id),
      );
    else if (!atCapacity) set("genres", [...genres, id]);
  };

  const applyGroup = (groupId: GenreGroupId) => {
    set("genres", GENRE_GROUPS[groupId].slice(0, MAX_GENRES) as Genre[]);
    setOpen(false);
  };

  const matchingGenre = genres.find((g) =>
    (GENRES_WITHOUT_GRAPHICS_SETTINGS as readonly string[]).includes(g),
  );
  const showHint = !!matchingGenre && !skipGraphicsSettings && !hintDismissed;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-5 items-center justify-between gap-2">
        <span id={labelId} className="text-text-secondary text-xs font-medium">
          {t("editor.genre")}
        </span>
        <span className="text-text-muted tabular text-xs">
          {genres.length}/{MAX_GENRES}
        </span>
      </div>

      <div
        role="group"
        aria-labelledby={labelId}
        className="border-border bg-surface-0 min-h-control rounded-control flex flex-wrap items-center gap-1.5 border p-1"
      >
        {genres.map((id) => (
          <span
            key={id}
            className="bg-accent-muted text-accent inline-flex h-7 items-center gap-1 rounded-full pr-1 pl-2.5 text-xs font-medium"
          >
            {labelOf(id)}
            <button
              type="button"
              onClick={() => toggle(id)}
              aria-label={t("editor.genreRemove", { genre: labelOf(id) })}
              className="hover:bg-accent/20 flex size-5 cursor-pointer items-center justify-center rounded-full"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </span>
        ))}

        <PopoverRoot open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={clsx(
              "text-text-muted hover:text-text-primary hover:bg-surface-2 inline-flex h-7 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-medium transition-colors",
              genres.length === 0 && "text-text-secondary",
            )}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {genres.length === 0 ? t("editor.genrePick") : t("editor.genreAdd")}
          </PopoverTrigger>
          <PopoverContent ariaLabel={t("editor.genre")} className="w-80">
            <Suspense
              fallback={
                <div className="text-text-muted flex justify-center py-8">
                  <Spinner className="size-4" />
                </div>
              }
            >
              <GenreList
                options={options}
                selected={genres}
                atCapacity={atCapacity}
                onToggle={toggle}
                onApplyGroup={applyGroup}
              />
            </Suspense>
          </PopoverContent>
        </PopoverRoot>
      </div>

      {showHint && (
        <Banner
          tone="accent"
          className="mt-1"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => {
                  set("skipGraphicsSettings", true);
                  setHintDismissed(true);
                }}
              >
                {t("editor.skipGraphicsHintHide")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setHintDismissed(true)}>
                {t("editor.skipGraphicsHintKeep")}
              </Button>
            </div>
          }
        >
          {t("editor.skipGraphicsHintLabel")}
        </Banner>
      )}
    </div>
  );
}
