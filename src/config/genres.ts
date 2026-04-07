export const GENRES = [
  { id: "action", labelKey: "genres.action", icon: "⚔️" },
  { id: "horror", labelKey: "genres.horror", icon: "👻" },
  { id: "rpg", labelKey: "genres.rpg", icon: "🛡" },
  { id: "fps", labelKey: "genres.fps", icon: "🔫" },
  { id: "openworld", labelKey: "genres.openworld", icon: "🌍" },
  { id: "indie", labelKey: "genres.indie", icon: "🕹" },
  { id: "soulslike", labelKey: "genres.soulslike", icon: "💀" },
  { id: "racing", labelKey: "genres.racing", icon: "🏎" },
  { id: "story", labelKey: "genres.story", icon: "📖" },
  { id: "simulation", labelKey: "genres.simulation", icon: "🏗" },
  { id: "fighting", labelKey: "genres.fighting", icon: "🥊" },
  { id: "stealth", labelKey: "genres.stealth", icon: "🥷" },
  { id: "survival_craft", labelKey: "genres.survival_craft", icon: "⛏" },
  { id: "roguelike", labelKey: "genres.roguelike", icon: "🎲" },
  { id: "metroidvania", labelKey: "genres.metroidvania", icon: "🗺" },
] as const;

export type GenreId = (typeof GENRES)[number]["id"];
