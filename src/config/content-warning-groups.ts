import type { ContentWarning } from "@engine/types";

/**
 * UI grouping for the content-warning checklist. The engine doesn't
 * care about groups — render order in the description follows the
 * user's selection order in the array — but the editor uses these
 * groups to render collapsible sections so 40+ items are scannable.
 *
 * Add a new warning by:
 * 1. Appending the id to {@link CONTENT_WARNINGS} in `@engine/types`.
 * 2. Adding it to one of these groups (UI placement).
 * 3. Translating `description.contentWarnings.items.{id}` in all locales
 *    + the editor's `editor.contentWarningOptions.{id}` short label.
 */
export interface ContentWarningGroup {
  id: string;
  /** i18n key for the group heading shown in the editor. */
  labelKey: string;
  items: ContentWarning[];
}

export const CONTENT_WARNING_GROUPS: readonly ContentWarningGroup[] = [
  {
    id: "spoilers",
    labelKey: "editor.contentWarningGroups.spoilers",
    items: [
      "spoiler_story",
      "spoiler_ending",
      "spoiler_true_ending",
      "spoiler_post_game",
      "spoiler_secret_ending",
      "spoiler_dlc",
    ],
  },
  {
    id: "photosensitive",
    labelKey: "editor.contentWarningGroups.photosensitive",
    items: ["flashing_lights", "motion_sickness", "migraine_trigger", "loud_noises"],
  },
  {
    id: "phobias",
    labelKey: "editor.contentWarningGroups.phobias",
    items: [
      "jump_scares",
      "acrophobia",
      "trypophobia",
      "thalassophobia",
      "claustrophobia",
      "arachnophobia",
      "entomophobia",
      "ophidiophobia",
    ],
  },
  {
    id: "mental_health",
    labelKey: "editor.contentWarningGroups.mental_health",
    items: [
      "anxiety_inducing",
      "depression_themes",
      "eating_disorders",
      "substance_use",
      "self_harm",
      "ptsd_themes",
      "needles",
      "body_fluids",
      "pregnancy_horror",
      "illness_themes",
    ],
  },
  {
    id: "sensitive",
    labelKey: "editor.contentWarningGroups.sensitive",
    items: [
      "blood_gore",
      "mature_18plus",
      "disturbing_imagery",
      "animal_abuse",
      "child_harm",
      "domestic_violence",
      "sexual_assault",
      "torture",
      "religion_themes",
      "war_violence",
      "discrimination",
      "police_violence",
      "smoking_drinking",
      "detailed_killing",
      "cult_occult",
      "psychological_manipulation",
      "grief_loss",
      "kidnapping",
    ],
  },
] as const;
