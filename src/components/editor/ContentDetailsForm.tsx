import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { useEditorStore } from "@store/editor-store";
import {
  PLAYTHROUGH_STATUSES,
  DIFFICULTY_LEVELS,
  type PlaythroughStatus,
  type DifficultyLevel,
} from "@engine/types";

/**
 * Metadata that tells viewers "what kind of run is this". Lives in the
 * Content Details accordion alongside timestamps. v0.11 moved the
 * content-warning checklist out into its own component
 * ({@link ContentWarningChecklist}) — 40+ items needed a searchable
 * grouped layout that didn't fit the generic ChipGroup primitive.
 *
 * Design notes:
 * - Playthrough + Difficulty default to `"none"`, which renders as "(no
 *   value)" in the select and suppresses the section in the generated
 *   description. Makes "no opinion" explicit rather than ambiguous.
 * - The custom-difficulty input only appears when the creator picks
 *   `"custom"` — free-form text is intentionally not translated, so
 *   game-specific names like "Lethal" or "Blueberry" survive a locale
 *   switch unchanged.
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
    </div>
  );
}
