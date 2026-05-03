/**
 * Gacha-game quest taxonomy (v0.9 phase 1). One literal union covering
 * the 17 quest patterns we see across major gacha titles — Genshin,
 * Honkai: Star Rail, Wuthering Waves, ZZZ, Honkai Impact 3rd, Reverse
 * 1999, Nikke, Azur Lane, Granblue, etc. Game-specific names like
 * "Archon Quest" (Genshin) or "Trailblaze Mission" (HSR) collapse into
 * `main_story`; "Hangout" / "Agent Story" collapse into
 * `companion_quest`; "Spiral Abyss" / "Memory of Chaos" / "Tower of
 * Adversity" / "Shiyu Defense" all collapse into `endgame`.
 *
 * Order matters: this is also the dropdown rendering order in the
 * editor, grouped by use case (story → events → tutorial/trial →
 * endgame/multiplayer → showcase).
 */
export const GACHA_QUEST_TYPES = [
  // Story (6)
  "main_story",
  "world_quest",
  "side_quest",
  "spinoff_quest",
  "companion_quest",
  "bond_quest",
  // Events (4)
  "event",
  "anniversary",
  "crossover",
  "dating_event",
  // Tutorial / Trial (3)
  "tutorial_quest",
  "guide_quest",
  "trial_quest",
  // Endgame / Multiplayer (3)
  "endgame",
  "coop",
  "daily_commission",
  // Showcase (1)
  "showcase",
] as const;

export type GachaQuestType = (typeof GACHA_QUEST_TYPES)[number];

export const DEFAULT_GACHA_QUEST_TYPE: GachaQuestType = "main_story";

export type GachaQuestTypeGroup =
  | "story"
  | "events"
  | "tutorial_trial"
  | "endgame_multiplayer"
  | "showcase";

/**
 * Display-order grouping for the quest-type dropdown. Each group
 * surfaces a small heading (i18n: `editor.gachaQuestTypeGroups.<id>`)
 * above its members.
 */
export const GACHA_QUEST_TYPE_GROUPS: ReadonlyArray<{
  group: GachaQuestTypeGroup;
  members: readonly GachaQuestType[];
}> = [
  {
    group: "story",
    members: [
      "main_story",
      "world_quest",
      "side_quest",
      "spinoff_quest",
      "companion_quest",
      "bond_quest",
    ],
  },
  {
    group: "events",
    members: ["event", "anniversary", "crossover", "dating_event"],
  },
  {
    group: "tutorial_trial",
    members: ["tutorial_quest", "guide_quest", "trial_quest"],
  },
  {
    group: "endgame_multiplayer",
    members: ["endgame", "coop", "daily_commission"],
  },
  {
    group: "showcase",
    members: ["showcase"],
  },
];

/**
 * `partNumber` rendering style per quest type. Title-builder consumes
 * this to decide whether the title's part-suffix reads "Part N", "Day
 * N", "Floor N", or is dropped entirely. The four values map to
 * `title.gachaPartSuffix.{part|day|floor}` translation keys; `none`
 * skips the suffix.
 */
export type GachaPartSuffixStyle = "part" | "day" | "floor" | "none";

export const GACHA_PART_SUFFIX_STYLES: Record<GachaQuestType, GachaPartSuffixStyle> = {
  main_story: "part",
  world_quest: "none",
  side_quest: "none",
  spinoff_quest: "none",
  companion_quest: "none",
  bond_quest: "none",
  event: "none",
  anniversary: "day",
  crossover: "none",
  dating_event: "none",
  tutorial_quest: "none",
  guide_quest: "none",
  trial_quest: "none",
  endgame: "floor",
  coop: "none",
  daily_commission: "day",
  showcase: "none",
};
