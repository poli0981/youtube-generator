import pkg from "../../package.json";

/**
 * App metadata + author / social links surfaced on the About page.
 *
 * Versions come from `package.json` so the About page never lies after a
 * version bump. Empty social URLs are hidden by the page; fill in the
 * channel / handle URLs you want to expose before tagging a release.
 */
export const ABOUT = {
  appName: "YTDescGen",
  version: pkg.version,
  license: "MIT",
  repo: "https://github.com/poli0981/youtube-generator",
  issuesUrl: "https://github.com/poli0981/youtube-generator/issues",
  licenseUrl: "https://github.com/poli0981/youtube-generator/blob/main/LICENSE",
  githubAuthor: "https://github.com/poli0981",
  socials: {
    youtube: "https://www.youtube.com/@SkullMute",
    x: "https://x.com/SkullMute0011",
    discord: "https://discord.gg/2aNR3aVt",
    kofi: "https://ko-fi.com/skullmute",
    patreon: "https://www.patreon.com/skullmute",
  },
} as const;

export type AboutSocialId = keyof typeof ABOUT.socials;
