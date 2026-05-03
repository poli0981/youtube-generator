export const VIDEO_TYPES = [
  { id: "full", labelKey: "videoTypes.full", icon: "🎮", extraFields: [] },
  { id: "part", labelKey: "videoTypes.part", icon: "📂", extraFields: ["partNumber"] },
  { id: "full_demo", labelKey: "videoTypes.full_demo", icon: "🎬", extraFields: [] },
  { id: "demo_part", labelKey: "videoTypes.demo_part", icon: "🎞", extraFields: ["partNumber"] },
  { id: "boss", labelKey: "videoTypes.boss", icon: "👹", extraFields: ["bossName"] },
  { id: "boss_nohit", labelKey: "videoTypes.boss_nohit", icon: "💀", extraFields: ["bossName"] },
  { id: "ending", labelKey: "videoTypes.ending", icon: "🏁", extraFields: [] },
  { id: "speedrun", labelKey: "videoTypes.speedrun", icon: "⚡", extraFields: [] },
  { id: "100percent", labelKey: "videoTypes.100percent", icon: "💯", extraFields: [] },
  { id: "dlc", labelKey: "videoTypes.dlc", icon: "📦", extraFields: ["dlcName"] },
  { id: "newgame_plus", labelKey: "videoTypes.newgame_plus", icon: "🔄", extraFields: [] },
  { id: "challenge", labelKey: "videoTypes.challenge", icon: "🏆", extraFields: ["challengeName"] },
  { id: "side_quest", labelKey: "videoTypes.side_quest", icon: "📌", extraFields: [] },
  { id: "secret", labelKey: "videoTypes.secret", icon: "🔍", extraFields: [] },
  { id: "comparison", labelKey: "videoTypes.comparison", icon: "⚖️", extraFields: [] },
  { id: "guide", labelKey: "videoTypes.guide", icon: "📘", extraFields: [] },
  { id: "mods", labelKey: "videoTypes.mods", icon: "🧩", extraFields: ["modName"] },
  { id: "collectibles", labelKey: "videoTypes.collectibles", icon: "⭐", extraFields: [] },
  {
    id: "livestream",
    labelKey: "videoTypes.livestream",
    icon: "🔴",
    extraFields: ["liveUrl", "scheduledTime"],
  },
  {
    id: "gacha_quest",
    labelKey: "videoTypes.gacha_quest",
    icon: "🎴",
    extraFields: ["gachaQuestType", "chapterName", "questName", "partNumber"],
  },
] as const;

export type VideoTypeId = (typeof VIDEO_TYPES)[number]["id"];
