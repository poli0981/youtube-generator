export const SOCIAL_FIELDS = [
  { id: "kofi", labelKey: "social.kofi", urlPrefix: "https://ko-fi.com/", category: "donate" },
  {
    id: "patreon",
    labelKey: "social.patreon",
    urlPrefix: "https://patreon.com/",
    category: "donate",
  },
  {
    id: "buymeacoffee",
    labelKey: "social.buymeacoffee",
    urlPrefix: "https://buymeacoffee.com/",
    category: "donate",
  },
  {
    id: "paypal",
    labelKey: "social.paypal",
    urlPrefix: "https://paypal.me/",
    category: "donate",
  },
  { id: "github", labelKey: "social.github", urlPrefix: "https://github.com/", category: "social" },
  { id: "twitter", labelKey: "social.twitter", urlPrefix: "https://x.com/", category: "social" },
  { id: "discord", labelKey: "social.discord", urlPrefix: "https://discord.gg/", category: "social" },
  { id: "website", labelKey: "social.website", urlPrefix: "", category: "social" },
] as const;

export type SocialFieldId = (typeof SOCIAL_FIELDS)[number]["id"];
export type SocialCategory = "donate" | "social";
