export const VIDEO_TYPES = [
  { id: "full", labelKey: "videoTypes.full", icon: "🎮", extraFields: [] },
  { id: "part", labelKey: "videoTypes.part", icon: "📂", extraFields: ["partNumber"] },
  { id: "boss", labelKey: "videoTypes.boss", icon: "👹", extraFields: ["bossName"] },
  { id: "boss_nohit", labelKey: "videoTypes.boss_nohit", icon: "💀", extraFields: ["bossName"] },
  { id: "ending", labelKey: "videoTypes.ending", icon: "🏁", extraFields: [] },
  { id: "speedrun", labelKey: "videoTypes.speedrun", icon: "⚡", extraFields: [] },
  { id: "100percent", labelKey: "videoTypes.100percent", icon: "💯", extraFields: [] },
] as const;

export type VideoTypeId = (typeof VIDEO_TYPES)[number]["id"];
