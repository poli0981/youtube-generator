import type { GeneratorInput, TranslationFn, CharLimitWarning } from "./types";
import { YT_LIMITS } from "./types";
import { PLATFORMS } from "@config/platforms";
import { SOCIAL_FIELDS } from "@config/social-fields";
import { formatRigValue } from "@config/rig-fields";
import { parseTimeline, renderTimeline } from "./timeline-parser";
import { sanitizeHashtag } from "@utils/sanitize";

const SOCIAL_ICONS: Record<string, string> = {
  kofi: "☕",
  patreon: "🎨",
  buymeacoffee: "☕",
  paypal: "💸",
  streamlabs: "🎬",
  github: "🐙",
  twitter: "🐦",
  discord: "💬",
  twitch: "📺",
  tiktok: "🎵",
  instagram: "📸",
  bluesky: "🦋",
  mastodon: "🐘",
  facebook: "👤",
  fb_page: "📄",
  fb_group: "👥",
  website: "🌐",
};

function hasEntries(obj: Partial<Record<string, string>>): boolean {
  return Object.values(obj).some((v) => v && v.trim() !== "");
}

function getLabelForId(id: string, configs: readonly { id: string; label: string }[]): string {
  return configs.find((c) => c.id === id)?.label ?? id;
}

export interface BuildDescriptionOptions {
  hashtagCount?: number;
  /** When true and channelName is non-empty, appends an auto-generated
   *  copyright line after the CTA. */
  showCopyright?: boolean;
  /** When true, appends a localised usage-policy block after the
   *  copyright line. */
  showUsagePolicy?: boolean;
  /** When true and both `sponsorName` and `sponsorPlatform` are set,
   *  emits a "🎁 Thanks to …" credit line above the music section. */
  showSponsorCredit?: boolean;
}

export function buildDescription(
  input: GeneratorInput,
  t: TranslationFn,
  options: BuildDescriptionOptions = {},
): string {
  const {
    hashtagCount = 3,
    showCopyright = false,
    showUsagePolicy = false,
    showSponsorCredit = false,
  } = options;
  const sections: string[] = [];
  const gameName =
    input.gameNameLocalized?.[input.language] ?? input.gameName;

  // 1. Intro
  const intro = t(`description.intro.${input.videoType}`, {
    gameName,
    channelName: input.channelName,
    partNumber: input.partNumber ?? "",
    bossName: input.bossName ?? "",
    dlcName: input.dlcName ?? "",
    challengeName: input.challengeName ?? "",
    modName: input.modName ?? "",
  });
  sections.push(intro);

  // 2. No Commentary tagline
  sections.push(t("description.noCommentaryLine"));

  // 3. Timestamps (parsed + localized keywords)
  if (input.timestamps && input.timestamps.trim()) {
    const entries = parseTimeline(input.timestamps);
    const rendered = renderTimeline(entries, input.language, t);
    sections.push(`${t("description.sections.timestamps")}\n${rendered}`);
  }

  // 4. Store Links (heading + per-link suffix by pricing category)
  if (hasEntries(input.storeLinks)) {
    const entries = Object.entries(input.storeLinks)
      .filter((entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[1].trim() !== "",
      )
      .map(([id, url]) => ({
        id,
        url: url.trim(),
        type: (input.storeLinkTypes?.[id] ?? "paid") as "paid" | "free" | "demo",
      }));

    if (entries.length > 0) {
      // Majority rule: if more than half the links are free/demo,
      // switch the heading to "DOWNLOAD THE GAME". Ties favour "GET".
      const nonPaid = entries.filter((e) => e.type !== "paid").length;
      const headingKey =
        nonPaid > entries.length / 2
          ? "description.sections.storeLinksDownload"
          : "description.sections.storeLinksBuy";

      const lines = entries
        .map((e) => {
          const label = getLabelForId(e.id, PLATFORMS);
          const suffix =
            e.type === "demo"
              ? ` (${t("description.storeLinkSuffix.demo")})`
              : e.type === "free"
                ? ` (${t("description.storeLinkSuffix.free")})`
                : "";
          return `🎮 ${label}${suffix}: ${e.url}`;
        })
        .join("\n");

      sections.push(`${t(headingKey)}\n${lines}`);
    }
  }

  // 5. Video Settings
  const settings: string[] = [];
  if (input.resolution) settings.push(input.resolution);
  if (input.fps) settings.push(`${input.fps} FPS`);
  if (input.graphicsPreset) settings.push(input.graphicsPreset);
  if (settings.length > 0) {
    sections.push(`${t("description.sections.videoSettings")}\n${settings.join(" | ")}`);
  }

  // 6. Rig
  if (hasEntries(input.rig)) {
    const rigLines = Object.entries(input.rig)
      .map(([k, v]) => [k, formatRigValue(k, v ?? "")] as const)
      .filter(([, v]) => v && v.trim() !== "")
      .map(([k, v]) => `${k.replace(/_/g, " ").toUpperCase()}: ${v}`)
      .join("\n");
    if (rigLines) {
      sections.push(`${t("description.sections.rig")}\n${rigLines}`);
    }
  }

  // 7. Spoiler Warning
  if (input.spoilerWarning) {
    sections.push(t("description.sections.spoilerWarning"));
  }

  // 8. Mature Warning
  if (input.matureWarning) {
    sections.push(t("description.sections.matureWarning"));
  }

  // 8.3. Sponsor credit — appears above the music / donate block so the
  // "thanks to X" line stands out. Only renders when both the toggle is
  // on AND the creator has filled in BOTH the sponsor name and the
  // platform; partial data is treated as "not ready, skip" rather than
  // rendered with holes.
  if (
    showSponsorCredit &&
    input.sponsorName &&
    input.sponsorName.trim() &&
    input.sponsorPlatform &&
    input.sponsorPlatform.trim()
  ) {
    sections.push(
      t("description.sections.sponsorCredit", {
        sponsor: input.sponsorName.trim(),
        platform: input.sponsorPlatform.trim(),
      }),
    );
  }

  // 8.5. Music / sound attribution — sits right before the donate
  // block because both are "credits"-adjacent sections.
  if (input.musicAttribution && input.musicAttribution.trim()) {
    sections.push(
      `${t("description.sections.music")}\n${input.musicAttribution.trim()}`,
    );
  }

  // 9. Donate Links (use proper labels + icons)
  const donateEntries = Object.entries(input.social)
    .filter(([k, v]) => {
      const field = SOCIAL_FIELDS.find((f) => f.id === k);
      return field?.category === "donate" && v && v.trim() !== "";
    })
    .map(([k, v]) => `${SOCIAL_ICONS[k] ?? "💰"} ${getLabelForId(k, SOCIAL_FIELDS)}: ${v}`);
  if (donateEntries.length > 0) {
    sections.push(`${t("description.sections.donate")}\n${donateEntries.join("\n")}`);
  }

  // 10. Social Links (use proper labels + icons)
  const socialEntries = Object.entries(input.social)
    .filter(([k, v]) => {
      const field = SOCIAL_FIELDS.find((f) => f.id === k);
      return field?.category === "social" && v && v.trim() !== "";
    })
    .map(([k, v]) => `${SOCIAL_ICONS[k] ?? "🔗"} ${getLabelForId(k, SOCIAL_FIELDS)}: ${v}`);
  if (socialEntries.length > 0) {
    sections.push(`${t("description.sections.social")}\n${socialEntries.join("\n")}`);
  }

  // 11. Playlist
  if (input.playlistLink && input.playlistLink.trim()) {
    sections.push(t("description.sections.playlist", { link: input.playlistLink }));
  }

  // 12. Contact
  if (input.contactEmail && input.contactEmail.trim()) {
    sections.push(t("description.sections.contact", { email: input.contactEmail }));
  }

  // 13. CTA
  sections.push(t("description.sections.cta"));

  // 13.5 Copyright line — auto-generated from channelName + current year.
  // Skipped when the creator hasn't set a channel name (nothing to claim).
  if (showCopyright && input.channelName.trim()) {
    const year = new Date().getFullYear();
    sections.push(
      t("description.sections.copyright", {
        year: String(year),
        channelName: input.channelName.trim(),
      }),
    );
  }

  // 13.7 Usage policy — fixed localised template behind a Settings toggle.
  if (showUsagePolicy) {
    const header = t("description.sections.usagePolicyHeader");
    const body = t("description.sections.usagePolicy");
    sections.push(`${header}\n${body}`);
  }

  // 14. Hashtags — first genre is the primary tag; any further genres are
  // already represented in the tag list so they don't duplicate here.
  const primaryGenre = input.genres[0];
  const allHashtags = [
    `#${sanitizeHashtag(gameName)}`,
    "#GameplayNoCommentary",
    ...(primaryGenre ? [`#${sanitizeHashtag(primaryGenre)}`] : []),
  ];
  sections.push(allHashtags.slice(0, hashtagCount).join(" "));

  return sections.join("\n\n");
}

export function checkDescriptionWarning(description: string): CharLimitWarning | null {
  if (description.length > YT_LIMITS.DESCRIPTION_MAX) {
    return {
      field: "description",
      current: description.length,
      limit: YT_LIMITS.DESCRIPTION_MAX,
      message: `Description exceeds ${YT_LIMITS.DESCRIPTION_MAX} characters (${description.length}/${YT_LIMITS.DESCRIPTION_MAX})`,
    };
  }
  return null;
}
