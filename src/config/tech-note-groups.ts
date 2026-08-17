import type { TechNote } from "@engine/types";

/**
 * UI grouping for the Tech Notes checklist (v0.12). Mirrors the shape
 * of {@link CONTENT_WARNING_GROUPS} — flat array on the engine side,
 * grouped here so 24+ items stay scannable in a collapsible UI.
 *
 * Add a new tech note by:
 * 1. Appending the id to {@link TECH_NOTES} in `@engine/types`.
 * 2. Adding it to one of these groups (UI placement only — engine
 *    renders bullets in the order the user picked them).
 * 3. Translating `description.techNotes.items.{id}` in all locales
 *    + the editor's `editor.techNoteOptions.{id}` short label.
 */
export interface TechNoteGroup {
  id: string;
  /** i18n key for the group heading shown in the editor. */
  labelKey: string;
  items: TechNote[];
}

export const TECH_NOTE_GROUPS: readonly TechNoteGroup[] = [
  {
    id: "audio",
    labelKey: "editor.techNoteGroups.audio",
    items: [
      "copyright_muted_sections",
      "volume_reduced_copyright",
      "music_replaced_copyright",
      "cutscene_audio_muted_only",
      "original_audio_kept",
    ],
  },
  {
    id: "video_quality",
    labelKey: "editor.techNoteGroups.video_quality",
    items: ["low_resolution_hardware", "low_graphics_performance", "fps_drops_hardware"],
  },
  {
    id: "recording_issues",
    labelKey: "editor.techNoteGroups.recording_issues",
    items: ["bug_from_game", "crash_kept_transparency", "loading_cut", "obs_artifacts_possible"],
  },
  {
    id: "playstyle",
    labelKey: "editor.techNoteGroups.playstyle",
    items: [
      "not_no_hit_run",
      "not_clean_walkthrough",
      "casual_no_commentary",
      "many_deaths_patience",
      "slow_exploration",
      "puzzle_stuck_possible",
      "grinding_cut",
      "not_speedrun_relaxed",
    ],
  },
  {
    id: "production",
    labelKey: "editor.techNoteGroups.production",
    items: [
      "exploration_focus_skip_combat",
      "edited_for_pacing",
      "support_developers",
      "online_connectivity_issues",
    ],
  },
] as const;
