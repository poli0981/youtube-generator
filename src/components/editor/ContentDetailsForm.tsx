import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { ChipGroup } from "@components/ui/ChipGroup";
import { useEditorStore } from "@store/editor-store";
import {
  PLAYTHROUGH_STATUSES,
  DIFFICULTY_LEVELS,
  CONTENT_WARNINGS,
  type PlaythroughStatus,
  type DifficultyLevel,
  type ContentWarning,
} from "@engine/types";

/**
 * Metadata that tells viewers "what kind of run is this and is it safe
 * to watch". Lives in the Content Details accordion alongside
 * timestamps + spoiler/mature toggles because all four are about
 * framing, not about the capture itself.
 *
 * Design notes:
 * - Playthrough + Difficulty default to `"none"`, which renders as "(no
 *   value)" in the select and suppresses the section in the generated
 *   description. Makes "no opinion" explicit rather than ambiguous.
 * - The custom-difficulty input only appears when the creator picks
 *   `"custom"` — free-form text is intentionally not translated, so
 *   game-specific names like "Lethal" or "Blueberry" survive a locale
 *   switch unchanged.
 * - Content warnings use the existing ChipGroup multi-select, capped at
 *   the full set (no `max` prop — every warning is additive).
 */
export function ContentDetailsForm() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

  const playthroughOptions = PLAYTHROUGH_STATUSES.map((id) => ({
    value: id,
    label: t(`editor.playthroughOptions.${id}`),
  }));

  const difficultyOptions = DIFFICULTY_LEVELS.map((id) => ({
    value: id,
    label: t(`editor.difficultyOptions.${id}`),
  }));

  const contentWarningOptions = CONTENT_WARNINGS.map((id) => ({
    id,
    label: t(`editor.contentWarningOptions.${id}`),
  }));

  return (
    <div className="flex flex-col gap-3">
      <Select
        label={t("editor.playthrough")}
        options={playthroughOptions}
        value={store.playthroughStatus}
        onChange={(v) => store.set("playthroughStatus", v as PlaythroughStatus)}
      />
      <Select
        label={t("editor.difficulty")}
        options={difficultyOptions}
        value={store.difficulty}
        onChange={(v) => store.set("difficulty", v as DifficultyLevel)}
      />
      {store.difficulty === "custom" && (
        <Input
          label={t("editor.difficultyCustomLabel")}
          placeholder={t("editor.difficultyCustomPlaceholder")}
          value={store.difficultyCustomLabel}
          onChange={(e) => store.set("difficultyCustomLabel", e.target.value)}
        />
      )}
      <ChipGroup
        label={t("editor.contentWarnings")}
        multiple
        options={contentWarningOptions}
        value={store.contentWarnings}
        onChange={(next) => store.set("contentWarnings", next as ContentWarning[])}
      />
    </div>
  );
}
