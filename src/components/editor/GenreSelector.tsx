import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChipGroup } from "@components/ui/ChipGroup";
import { GENRES } from "@config/genres";
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

  const options = GENRES.map((g) => ({
    id: g.id,
    label: t(g.labelKey),
    icon: g.icon,
  }));

  const matchingGenre = genres.find((g) =>
    (GENRES_WITHOUT_GRAPHICS_SETTINGS as readonly string[]).includes(g),
  );
  const showHint = !!matchingGenre && !skipGraphicsSettings && !hintDismissed;

  return (
    <div className="flex flex-col gap-2">
      <ChipGroup
        label={t("editor.genre")}
        multiple
        max={MAX_GENRES}
        options={options}
        value={genres}
        onChange={(next) => set("genres", next as Genre[])}
      />
      {showHint && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2 text-xs text-text-secondary">
          <span>{t("editor.skipGraphicsHintLabel")}</span>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              className="rounded bg-accent px-2 py-1 font-medium text-white"
              onClick={() => {
                set("skipGraphicsSettings", true);
                setHintDismissed(true);
              }}
            >
              {t("editor.skipGraphicsHintHide")}
            </button>
            <button
              type="button"
              className="rounded px-2 py-1 font-medium text-text-secondary hover:bg-surface-2"
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
