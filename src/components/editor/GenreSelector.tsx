import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChipGroup } from "@components/ui/ChipGroup";
import { GENRES, GENRE_GROUPS, GENRE_GROUP_IDS, type GenreGroupId } from "@config/genres";
import { GENRES_WITHOUT_GRAPHICS_SETTINGS } from "@config/graphics-settings";
import { useEditorStore } from "@store/editor-store";
import { MAX_GENRES, type Genre } from "@engine/types";

export function GenreSelector() {
  const { t } = useTranslation("ui");
  const genres = useEditorStore((s) => s.genres);
  const skipGraphicsSettings = useEditorStore((s) => s.skipGraphicsSettings);
  const set = useEditorStore((s) => s.set);
  // Session-local dismissal so the hint doesn't keep popping up after the
  // user has chosen "Keep". Forgets across reloads, which is fine — a
  // creator who flips back-and-forth between visual-novel and other genres
  // benefits from being reminded once per session.
  const [hintDismissed, setHintDismissed] = useState(false);
  const [filter, setFilter] = useState("");

  const allOptions = useMemo(
    () =>
      GENRES.map((g) => ({
        id: g.id,
        label: t(g.labelKey),
        icon: g.icon,
      })),
    [t],
  );

  const visibleOptions = useMemo(() => {
    const trimmed = filter.trim().toLowerCase();
    if (!trimmed) return allOptions;
    return allOptions.filter((o) => o.label.toLowerCase().includes(trimmed));
  }, [allOptions, filter]);

  const matchingGenre = genres.find((g) =>
    (GENRES_WITHOUT_GRAPHICS_SETTINGS as readonly string[]).includes(g),
  );
  const showHint = !!matchingGenre && !skipGraphicsSettings && !hintDismissed;

  const applyGroup = (groupId: GenreGroupId) => {
    const next = GENRE_GROUPS[groupId].slice(0, MAX_GENRES) as Genre[];
    set("genres", next);
    // Clear the filter so the user can see the newly-selected chips
    // light up — otherwise a stale filter could hide them all.
    setFilter("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-text-secondary text-sm font-medium">{t("editor.genre")}</span>
        <span className="text-text-muted text-xs">
          {genres.length}/{MAX_GENRES}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {GENRE_GROUP_IDS.map((groupId) => (
          <button
            key={groupId}
            type="button"
            onClick={() => applyGroup(groupId)}
            className="border-border bg-surface-1 text-text-secondary hover:border-accent hover:text-text-primary rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors"
          >
            {t(`editor.genreGroups.${groupId}`)}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t("editor.genreSearchPlaceholder")}
        className="focus:ring-accent/50 border-border bg-surface-1 text-text-primary placeholder:text-text-muted focus:border-accent rounded-lg border px-3 py-2 text-sm transition-colors focus:ring-2 focus:outline-none"
      />
      {visibleOptions.length === 0 ? (
        <p className="text-text-muted py-2 text-sm">{t("editor.genreSearchNoResults")}</p>
      ) : (
        <ChipGroup
          multiple
          max={MAX_GENRES}
          options={visibleOptions}
          value={genres}
          onChange={(next) => set("genres", next as Genre[])}
        />
      )}
      {showHint && (
        <div className="border-accent/40 bg-accent/5 text-text-secondary flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs">
          <span>{t("editor.skipGraphicsHintLabel")}</span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="bg-accent rounded px-2 py-1 font-medium text-white"
              onClick={() => {
                set("skipGraphicsSettings", true);
                setHintDismissed(true);
              }}
            >
              {t("editor.skipGraphicsHintHide")}
            </button>
            <button
              type="button"
              className="text-text-secondary hover:bg-surface-2 rounded px-2 py-1 font-medium"
              onClick={() => setHintDismissed(true)}
            >
              {t("editor.skipGraphicsHintKeep")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
