import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { useEditorStore } from "@store/editor-store";
import {
  PLAYTHROUGH_STATUSES,
  DIFFICULTY_LEVELS,
  type PlaythroughStatus,
  type DifficultyLevel,
  type LanguagePatch,
  type GameVersion,
} from "@engine/types";
import {
  LANGUAGE_PATCH_UI_OPTIONS,
  GAME_VERSION_UI_OPTIONS,
  languagePatchHasCustomSlot,
  gameVersionHasCustomSlot,
} from "@config/playthrough-options";

/**
 * v0.12 unified Playthrough Notes form. Replaces the v0.7
 * `ContentDetailsForm` (deleted in v0.12 — it only carried Playthrough
 * + Difficulty) with a 5-field block that maps 1:1 to the bullets of
 * the `▸ 🎮 PLAYTHROUGH NOTES` description section:
 *
 *   • Run type        ← `playthroughStatus` (existing)
 *   • Difficulty      ← `difficulty` (+ custom label, existing)
 *   • Endings shown   ← `endingsShown` (NEW free text)
 *   • Language patch  ← `languagePatch` (+ custom label, NEW)
 *   • Game version    ← `gameVersion` (+ custom label, NEW)
 *
 * Custom-text inputs only appear when their parent enum is set to a
 * custom-bearing value (`difficulty === "custom"`, language patch is
 * `"official_other"` or `"custom"`, etc.) — keeps the form compact in
 * the common path and surfaces the slot exactly when it's needed.
 */
export function PlaythroughNotesForm() {
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

  const languagePatchOptions = LANGUAGE_PATCH_UI_OPTIONS.map((opt) => ({
    value: opt.id,
    label: t(opt.labelKey),
  }));

  const gameVersionOptions = GAME_VERSION_UI_OPTIONS.map((opt) => ({
    value: opt.id,
    label: t(opt.labelKey),
  }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-text-secondary">
          {t("editor.playthroughNotes.title")}
        </span>
      </div>

      <Select
        label={t("editor.playthroughNotes.runTypeLabel")}
        options={playthroughOptions}
        value={store.playthroughStatus}
        onChange={(v) => store.set("playthroughStatus", v as PlaythroughStatus)}
      />

      <Select
        label={t("editor.playthroughNotes.difficultyLabel")}
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

      <Input
        label={t("editor.playthroughNotes.endingsLabel")}
        placeholder={t("editor.playthroughNotes.endingsPlaceholder")}
        value={store.endingsShown}
        onChange={(e) => store.set("endingsShown", e.target.value)}
      />

      <Select
        label={t("editor.playthroughNotes.languagePatchLabel")}
        options={languagePatchOptions}
        value={store.languagePatch}
        onChange={(v) => store.set("languagePatch", v as LanguagePatch)}
      />
      {languagePatchHasCustomSlot(store.languagePatch) && (
        <Input
          label={t("editor.playthroughNotes.languagePatchCustomLabel")}
          placeholder={t("editor.playthroughNotes.languagePatchCustomPlaceholder")}
          value={store.languagePatchCustom}
          onChange={(e) => store.set("languagePatchCustom", e.target.value)}
        />
      )}

      <Select
        label={t("editor.playthroughNotes.gameVersionLabel")}
        options={gameVersionOptions}
        value={store.gameVersion}
        onChange={(v) => store.set("gameVersion", v as GameVersion)}
      />
      {gameVersionHasCustomSlot(store.gameVersion) && (
        <Input
          label={t("editor.playthroughNotes.gameVersionCustomLabel")}
          placeholder={t("editor.playthroughNotes.gameVersionCustomPlaceholder")}
          value={store.gameVersionCustom}
          onChange={(e) => store.set("gameVersionCustom", e.target.value)}
        />
      )}
    </div>
  );
}
