import { useTranslation } from "react-i18next";
import { Accordion } from "@components/ui/Accordion";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { GENRES } from "@config/genres";
import { FIELD_LIMITS } from "@config/field-limits";
import { useSettingsStore } from "@store/settings-store";
import { validatePlaylistUrl } from "@utils/validation";

/**
 * Per-genre YouTube playlist URLs, which the pinned-comment template uses to
 * suggest a playlist matching the video's primary genre (v0.8 phase 2).
 *
 * Extracted from SettingsPage in v0.35.0. It renders one input per genre — 42
 * of them — which made it both the tallest block on the page and a third of
 * its source. It now ships collapsed by default, with a filled-count badge so
 * the header still says something useful while closed.
 */
export function GenrePlaylistsSection() {
  const { t } = useTranslation("ui");
  const genrePlaylists = useSettingsStore((s) => s.genrePlaylists);
  const setSetting = useSettingsStore((s) => s.setSetting);
  const accordion = useSettingsStore((s) => s.settingsAccordionState);
  const toggleAccordion = useSettingsStore((s) => s.toggleSettingsAccordion);

  const filled = Object.values(genrePlaylists).filter((v) => v?.trim()).length;

  return (
    <Accordion
      id="genrePlaylists"
      icon="🎵"
      title={t("settings.genrePlaylistsTitle")}
      open={accordion.genrePlaylists ?? false}
      onToggle={() => toggleAccordion("genrePlaylists")}
      badge={
        <span className="bg-surface-2 text-text-muted rounded px-1.5 py-0.5 text-xs">
          {t("settings.genrePlaylistsBadge", { filled, total: GENRES.length })}
        </span>
      }
    >
      <p className="text-text-muted text-xs">{t("settings.genrePlaylistsHelp")}</p>
      <p className="text-text-muted text-xs">{t("settings.genrePlaylistsEmptyHint")}</p>
      <div className="flex flex-col gap-2">
        {GENRES.map((g) => (
          <ValidatedInput
            key={g.id}
            label={`${g.icon} ${t(g.labelKey)}`}
            maxLength={FIELD_LIMITS.URL}
            placeholder="https://www.youtube.com/playlist?list=..."
            value={genrePlaylists[g.id] ?? ""}
            onChange={(v) => {
              const trimmed = v.trim();
              if (trimmed) {
                setSetting("genrePlaylists", { ...genrePlaylists, [g.id]: trimmed });
              } else {
                // Empty input → drop this genre's entry entirely so the map
                // stays sparse. Filter pattern instead of `delete` satisfies
                // @typescript-eslint/no-dynamic-delete.
                setSetting(
                  "genrePlaylists",
                  Object.fromEntries(Object.entries(genrePlaylists).filter(([k]) => k !== g.id)),
                );
              }
            }}
            validate={validatePlaylistUrl}
          />
        ))}
      </div>
    </Accordion>
  );
}
