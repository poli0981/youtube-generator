import { Music2, Instagram, Facebook, type LucideIcon } from "lucide-react";

/**
 * A short-form platform the cross-post generator targets (v0.24.0). Each
 * one re-packages the same YouTube source (title, rig, content warnings,
 * copyright, thanks, hashtags) under its own character ceiling and a
 * curated set of platform-popular hashtags.
 *
 * Add a platform here and the Social page + bulk loop pick it up
 * automatically — same data-driven pattern as `@config/platforms` and
 * `@config/social-fields`.
 */
export interface SocialPlatform {
  readonly id: "tiktok" | "instagram_reels" | "facebook_reels";
  /** i18n key under `socialPost.platforms.<id>`. */
  readonly labelKey: string;
  /** Caption character ceiling enforced by the platform. */
  readonly charLimit: number;
  readonly icon: LucideIcon;
  /**
   * Platform-popular hashtags appended after the game / genre hashtags.
   * Stored with the leading `#`; deduped case-insensitively against the
   * derived hashtags at build time.
   */
  readonly popularHashtags: readonly string[];
}

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    id: "tiktok",
    labelKey: "socialPost.platforms.tiktok",
    charLimit: 4000,
    icon: Music2, // lucide has no TikTok glyph; Music2 is the established stand-in
    popularHashtags: [
      "#fyp",
      "#foryou",
      "#foryoupage",
      "#gaming",
      "#gamingtiktok",
      "#gameplay",
      "#gamer",
    ],
  },
  {
    id: "instagram_reels",
    labelKey: "socialPost.platforms.instagram_reels",
    charLimit: 2200,
    icon: Instagram,
    popularHashtags: [
      "#reels",
      "#reelsinstagram",
      "#gaming",
      "#gamingreels",
      "#gamer",
      "#instagaming",
      "#videogames",
    ],
  },
  {
    id: "facebook_reels",
    labelKey: "socialPost.platforms.facebook_reels",
    charLimit: 2200,
    icon: Facebook,
    popularHashtags: [
      "#reels",
      "#facebookreels",
      "#fbreels",
      "#gaming",
      "#gameplay",
      "#gamingcommunity",
      "#videogames",
    ],
  },
] as const;
