export const GENRES = [
  { id: "action", labelKey: "genres.action", icon: "⚔️" },
  { id: "hack_slash", labelKey: "genres.hack_slash", icon: "🗡" },
  { id: "beatemup", labelKey: "genres.beatemup", icon: "👊" },
  { id: "platformer", labelKey: "genres.platformer", icon: "🦘" },
  { id: "horror", labelKey: "genres.horror", icon: "👻" },
  { id: "survival_horror", labelKey: "genres.survival_horror", icon: "🧟" },
  { id: "psychological_horror", labelKey: "genres.psychological_horror", icon: "🧠" },
  { id: "rpg", labelKey: "genres.rpg", icon: "🛡" },
  { id: "jrpg", labelKey: "genres.jrpg", icon: "🎎" },
  { id: "action_rpg", labelKey: "genres.action_rpg", icon: "🏹" },
  { id: "crpg", labelKey: "genres.crpg", icon: "📜" },
  { id: "fps", labelKey: "genres.fps", icon: "🔫" },
  { id: "arena_shooter", labelKey: "genres.arena_shooter", icon: "🎯" },
  { id: "tactical_fps", labelKey: "genres.tactical_fps", icon: "🎖" },
  { id: "boomer_shooter", labelKey: "genres.boomer_shooter", icon: "💥" },
  { id: "extraction_shooter", labelKey: "genres.extraction_shooter", icon: "🎒" },
  { id: "shmup", labelKey: "genres.shmup", icon: "🛸" },
  { id: "openworld", labelKey: "genres.openworld", icon: "🌍" },
  { id: "indie", labelKey: "genres.indie", icon: "🕹" },
  { id: "soulslike", labelKey: "genres.soulslike", icon: "💀" },
  { id: "racing", labelKey: "genres.racing", icon: "🏎" },
  { id: "story", labelKey: "genres.story", icon: "📖" },
  { id: "simulation", labelKey: "genres.simulation", icon: "🏗" },
  { id: "city_builder", labelKey: "genres.city_builder", icon: "🏙" },
  { id: "fighting", labelKey: "genres.fighting", icon: "🥊" },
  { id: "stealth", labelKey: "genres.stealth", icon: "🥷" },
  { id: "survival_craft", labelKey: "genres.survival_craft", icon: "⛏" },
  { id: "roguelike", labelKey: "genres.roguelike", icon: "🎲" },
  { id: "metroidvania", labelKey: "genres.metroidvania", icon: "🗺" },
  { id: "mmo", labelKey: "genres.mmo", icon: "🌐" },
  { id: "rhythm", labelKey: "genres.rhythm", icon: "🎵" },
  { id: "puzzle", labelKey: "genres.puzzle", icon: "🧩" },
  { id: "tower_defense", labelKey: "genres.tower_defense", icon: "🏰" },
  { id: "card_game", labelKey: "genres.card_game", icon: "🃏" },
  { id: "deck_builder", labelKey: "genres.deck_builder", icon: "🎴" },
  { id: "auto_battler", labelKey: "genres.auto_battler", icon: "🤖" },
  { id: "battle_royale", labelKey: "genres.battle_royale", icon: "🏆" },
  { id: "tactical", labelKey: "genres.tactical", icon: "♟" },
  { id: "space", labelKey: "genres.space", icon: "🚀" },
  { id: "farming", labelKey: "genres.farming", icon: "🌾" },
  { id: "fmv", labelKey: "genres.fmv", icon: "🎬" },
  { id: "visual_novel", labelKey: "genres.visual_novel", icon: "💬" },
] as const;

export type GenreId = (typeof GENRES)[number]["id"];

/**
 * Ids for the bulk-select buttons rendered above the genre chip group.
 * Each id maps to a curated set of genres in {@link GENRE_GROUPS} and
 * an i18n label under `editor.genreGroups.<id>`.
 */
export type GenreGroupId = "rpg" | "shooter" | "horror";

/**
 * Bulk-toggle groups (v0.9 phase 2). Clicking the group's button
 * REPLACES the current selection with the first {@link MAX_GENRES} ids
 * from the list (so the selection stays under the cap regardless of
 * how big the group is). Order in each list determines which ids get
 * picked when the group exceeds the cap.
 */
export const GENRE_GROUPS: Record<GenreGroupId, readonly GenreId[]> = {
  rpg: ["rpg", "jrpg", "action_rpg", "crpg"],
  shooter: [
    "fps",
    "arena_shooter",
    "tactical_fps",
    "boomer_shooter",
    "extraction_shooter",
    "shmup",
  ],
  horror: ["horror", "survival_horror", "psychological_horror"],
};

export const GENRE_GROUP_IDS: readonly GenreGroupId[] = ["rpg", "shooter", "horror"];
