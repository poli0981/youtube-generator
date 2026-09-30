import pkg from "../../package.json";

/**
 * App metadata, author and contact details surfaced on the About page.
 *
 * Versions come from `package.json` so the About page never lies after a
 * version bump. Empty social URLs are hidden by the page.
 *
 * Donate links live in `@config/donate` — they're "support" links, not
 * "presence" links.
 */
export const ABOUT = {
  appName: "YTDescGen",
  version: pkg.version,
  license: "Apache-2.0",
  website: "https://ytgenerator.stream",
  repo: "https://github.com/poli0981/youtube-generator",
  issuesUrl: "https://github.com/poli0981/youtube-generator/issues",
  bugReportUrl: "https://github.com/poli0981/youtube-generator/issues/new?template=bug_report.yml",
  discussionsUrl: "https://github.com/poli0981/youtube-generator/discussions",
  wikiUrl: "https://github.com/poli0981/youtube-generator/wiki",
  securityAdvisoryUrl: "https://github.com/poli0981/youtube-generator/security/advisories/new",
  author: {
    name: "SkullMute",
    github: "https://github.com/poli0981",
    website: "https://poli0981.dev/",
    links: "https://poli0981.dev/links/",
  },
  /**
   * One address per purpose, so a message lands with whoever handles it.
   * Keep in sync with SECURITY.md, PRIVACY.md, TERMS.md, NOTICE and
   * public/.well-known/security.txt.
   */
  contacts: {
    general: "contact@poli0981.dev",
    security: "security@poli0981.dev",
    privacy: "privacy@poli0981.dev",
    legal: "legal@poli0981.dev",
    dmca: "dmca@poli0981.dev",
    copyright: "copyright@poli0981.dev",
    code: "code@poli0981.dev",
    sponsor: "sponsor@poli0981.dev",
  },
  socials: {
    youtube: "https://www.youtube.com/@SkullMute",
    x: "https://x.com/SkullMute0011",
    bluesky: "https://bsky.app/profile/skullmute0011.bsky.social",
    mastodon: "https://mastodon.social/@skullmute1122",
    discord: "https://discord.gg/kDM9GMu5vm",
    steam: "https://steamcommunity.com/profiles/76561199544666292/",
    telegramBot: "https://t.me/my_skull_bot",
    telegramUser: "https://t.me/SkullMute0011",
  },
} as const;

export type AboutSocialId = keyof typeof ABOUT.socials;
export type AboutContactId = keyof typeof ABOUT.contacts;
