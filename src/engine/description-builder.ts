import type { GeneratorInput, TranslationFn, CharLimitWarning } from "./types";
import { YT_LIMITS } from "./types";
import { PLATFORMS } from "@config/platforms";
import { SOCIAL_FIELDS } from "@config/social-fields";
import { formatRigValue } from "@config/rig-fields";
import { parseTimeline, renderTimeline } from "./timeline-parser";

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

export function buildDescription(
  input: GeneratorInput,
  t: TranslationFn,
  hashtagCount = 3,
): string {
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

  // 4. Store Links (use proper brand names from config)
  if (hasEntries(input.storeLinks)) {
    const links = Object.entries(input.storeLinks)
      .filter(([, v]) => v && v.trim() !== "")
      .map(([id, url]) => `🎮 ${getLabelForId(id, PLATFORMS)}: ${url}`)
      .join("\n");
    sections.push(`${t("description.sections.storeLinks")}\n${links}`);
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
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
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

  // 14. Hashtags
  const allHashtags = [
    `#${gameName.replace(/\s+/g, "")}`,
    "#GameplayNoCommentary",
    `#${input.genre}`,
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
