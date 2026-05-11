import pkg from "../../package.json";

/**
 * App metadata + author / social links surfaced on the About page.
 *
 * Versions come from `package.json` so the About page never lies after a
 * version bump. Empty social URLs are hidden by the page; fill in the
 * channel / handle URLs you want to expose before tagging a release.
 *
 * Note: Ko-fi / Patreon were moved out of `socials` into `@config/donate`
 * in v0.13.1 — they're "support" links, not "presence" links.
 */
export const ABOUT = {
  appName: "YTDescGen",
  version: pkg.version,
  license: "MIT",
  repo: "https://github.com/poli0981/youtube-generator",
  issuesUrl: "https://github.com/poli0981/youtube-generator/issues",
  bugReportUrl: "https://github.com/poli0981/youtube-generator/issues/new?template=bug_report.yml",
  discussionsUrl: "https://github.com/poli0981/youtube-generator/discussions",
  licenseUrl: "https://github.com/poli0981/youtube-generator/blob/main/LICENSE",
  githubAuthor: "https://github.com/poli0981",
  pcSpecDocUrl: "https://github.com/poli0981/youtube-generator/blob/main/docs/pc_spec.md",
  devEnvDocUrl: "https://github.com/poli0981/youtube-generator/blob/main/docs/dev_env.md",
  socials: {
    youtube: "https://www.youtube.com/@SkullMute",
    x: "https://x.com/SkullMute0011",
    bluesky: "https://bsky.app/profile/skullmute0011.bsky.social",
    mastodon: "https://mastodon.social/@skullmute1122",
    discord: "https://discord.gg/2aNR3aVt",
    discordGame: "https://discord.gg/kDM9GMu5vm",
    steam: "https://steamcommunity.com/profiles/76561199544666292/",
    telegramBot: "https://t.me/my_skull_bot",
    telegramUser: "https://t.me/SkullMute0011",
    email: "mailto:lopop05905@proton.me",
  },
} as const;

export type AboutSocialId = keyof typeof ABOUT.socials;
