export const PLATFORMS = [
  { id: "steam", label: "Steam", urlPrefix: "https://store.steampowered.com/app/" },
  { id: "epic", label: "Epic Games Store", urlPrefix: "https://store.epicgames.com/" },
  { id: "ps", label: "PlayStation Store", urlPrefix: "https://store.playstation.com/" },
  { id: "xbox", label: "Xbox / Microsoft Store", urlPrefix: "https://www.xbox.com/games/" },
  { id: "nintendo", label: "Nintendo eShop", urlPrefix: "https://www.nintendo.com/store/" },
  { id: "gog", label: "GOG", urlPrefix: "https://www.gog.com/game/" },
  { id: "itchio", label: "itch.io", urlPrefix: "https://itch.io/" },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]["id"];
