import {
  BlueskyIcon,
  FacebookIcon,
  InstagramIcon,
  ThreadsIcon,
  TiktokIcon,
  XIcon,
  YoutubeIcon,
  type IconComponent,
} from "@components/icons/brand";

/**
 * A platform the cross-post generator targets (v0.24.0). Each one
 * re-packages the same YouTube source (title, rig, content warnings,
 * copyright, thanks, hashtags) under its own character ceiling and a
 * curated set of platform-popular hashtags.
 *
 * Add a platform here and the Social page + bulk loop pick it up
 * automatically — same data-driven pattern as `@config/platforms` and
 * `@config/social-fields`.
 */
export interface SocialPlatform {
  readonly id:
    | "tiktok"
    | "instagram_reels"
    | "facebook_reels"
    | "youtube_shorts"
    | "x"
    | "threads"
    | "bluesky";
  /** i18n key under `socialPost.platforms.<id>`. */
  readonly labelKey: string;
  /** Caption character ceiling enforced by the platform. */
  readonly charLimit: number;
  readonly icon: IconComponent;
  /**
   * Platform-popular hashtags appended after the game / genre hashtags.
   * Stored with the leading `#`; deduped case-insensitively against the
   * derived hashtags at build time.
   */
  readonly popularHashtags: readonly string[];
  /** Most hashtags worth posting (Threads takes one topic per post). */
  readonly maxHashtags?: number;
  /**
   * How the platform counts toward `charLimit`. `"x"`: X's weighted count,
   * where CJK, Vietnamese letters with diacritics and emoji count twice.
   */
  readonly countMode?: "x";
}

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    id: "tiktok",
    labelKey: "socialPost.platforms.tiktok",
    charLimit: 4000,
    icon: TiktokIcon,
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
    id: "youtube_shorts",
    labelKey: "socialPost.platforms.youtube_shorts",
    charLimit: 5000,
    icon: YoutubeIcon,
    // YouTube shows the first three above the title; past that they only
    // add noise.
    popularHashtags: ["#shorts", "#gaming", "#gameplay"],
    maxHashtags: 5,
  },
  {
    id: "instagram_reels",
    labelKey: "socialPost.platforms.instagram_reels",
    charLimit: 2200,
    icon: InstagramIcon,
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
    icon: FacebookIcon,
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
  {
    id: "x",
    labelKey: "socialPost.platforms.x",
    charLimit: 280,
    icon: XIcon,
    popularHashtags: ["#gaming"],
    maxHashtags: 3,
    countMode: "x",
  },
  {
    id: "threads",
    labelKey: "socialPost.platforms.threads",
    charLimit: 500,
    icon: ThreadsIcon,
    popularHashtags: [],
    maxHashtags: 1,
  },
  {
    id: "bluesky",
    labelKey: "socialPost.platforms.bluesky",
    charLimit: 300,
    icon: BlueskyIcon,
    popularHashtags: ["#gaming"],
    maxHashtags: 3,
  },
] as const;
