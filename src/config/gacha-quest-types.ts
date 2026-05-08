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

/**
 * Quest-type → which extra fields to render in the Gacha-quest editor
 * (v0.13). Keeps the `extra-fields` UI surgical: Showcase replaces
 * Chapter/Quest with Character Name, Anniversary swaps the part-number
 * input for a 1–20 year dropdown, and the rest fall back to the default
 * Chapter/Quest/Part triplet. `gachaVersion` is always shown for the
 * `gacha_quest` video type, regardless of the selected quest type — it
 * applies broadly (game patch labels like "1.2", "2.4").
 */
export interface GachaQuestFieldVisibility {
  chapterName: boolean;
  questName: boolean;
  partNumber: boolean;
  characterName: boolean;
  anniversaryYear: boolean;
}

const DEFAULT_FIELD_VISIBILITY: GachaQuestFieldVisibility = {
  chapterName: true,
  questName: true,
  partNumber: true,
  characterName: false,
  anniversaryYear: false,
};

export const GACHA_QUEST_FIELD_VISIBILITY: Record<
  GachaQuestType,
  GachaQuestFieldVisibility
> = {
  main_story: { ...DEFAULT_FIELD_VISIBILITY, questName: false },
  world_quest: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  side_quest: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  spinoff_quest: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  companion_quest: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  bond_quest: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  event: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  anniversary: {
    chapterName: false,
    questName: false,
    partNumber: true,
    characterName: false,
    anniversaryYear: true,
  },
  crossover: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  dating_event: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  tutorial_quest: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  guide_quest: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  trial_quest: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  endgame: { ...DEFAULT_FIELD_VISIBILITY, questName: false },
  coop: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, partNumber: false },
  daily_commission: { ...DEFAULT_FIELD_VISIBILITY, chapterName: false, questName: false },
  showcase: {
    chapterName: false,
    questName: false,
    partNumber: false,
    characterName: true,
    anniversaryYear: false,
  },
};

/**
 * Per-quest-type placeholder hints for Chapter Name / Quest Name / Part
 * Number inputs (v0.13 QoL). Surfaces concrete examples so creators
 * don't have to guess what each field expects under different quest
 * patterns. Translated via `editor.placeholders.questType.<id>.<field>`
 * — fall back to the static defaults when the locale lacks the override.
 */
export interface GachaQuestPlaceholders {
  chapterName?: string;
  questName?: string;
  partNumber?: string;
}

export const GACHA_QUEST_PLACEHOLDERS: Record<GachaQuestType, GachaQuestPlaceholders> = {
  main_story: {
    chapterName: "e.g. Chapter 5 Act 2",
    partNumber: "e.g. Part 1",
  },
  world_quest: { questName: "e.g. The Hidden Path" },
  side_quest: { questName: "e.g. A Solitary Constellation" },
  spinoff_quest: { questName: "e.g. The Tale of Wuthering Waves" },
  companion_quest: { questName: "e.g. Yelan: Path of Stillness" },
  bond_quest: { questName: "e.g. Trust Mission - Hina" },
  event: { questName: "e.g. Summer Festival 2024" },
  anniversary: { partNumber: "Day 1, Day 7, etc." },
  crossover: { questName: "e.g. Honkai x Genshin Crossover" },
  dating_event: { questName: "e.g. Date with Furina" },
  tutorial_quest: { questName: "e.g. First Steps in Teyvat" },
  guide_quest: { questName: "e.g. How to upgrade artifacts" },
  trial_quest: { questName: "e.g. Adventure Trial - Diluc" },
  endgame: {
    chapterName: "e.g. Spiral Abyss / Memory of Chaos",
    partNumber: "Floor 12, Floor 11",
  },
  coop: { questName: "e.g. Co-op Boss Run" },
  daily_commission: { partNumber: "Day 1, Day 12, etc." },
  showcase: {},
};
