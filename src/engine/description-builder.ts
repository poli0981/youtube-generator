import type { GeneratorInput, TranslationFn, CharLimitWarning } from "./types";
import { YT_LIMITS } from "./types";

function hasEntries(obj: Partial<Record<string, string>>): boolean {
  return Object.values(obj).some((v) => v && v.trim() !== "");
}

function formatKeyValueBlock(
  obj: Partial<Record<string, string>>,
  labelMap?: Record<string, string>,
): string {
  return Object.entries(obj)
    .filter(([, v]) => v && v.trim() !== "")
    .map(([k, v]) => {
      const label = labelMap?.[k] ?? k.toUpperCase();
      return `${label}: ${v}`;
    })
    .join("\n");
}

export function buildDescription(input: GeneratorInput, t: TranslationFn): string {
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

  // 3. Timestamps
  if (input.timestamps && input.timestamps.trim()) {
    sections.push(`${t("description.sections.timestamps")}\n${input.timestamps.trim()}`);
  }

  // 4. Store Links
  if (hasEntries(input.storeLinks)) {
    const links = Object.entries(input.storeLinks)
      .filter(([, v]) => v && v.trim() !== "")
      .map(([platform, url]) => `${platform}: ${url}`)
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
    sections.push(`${t("description.sections.rig")}\n${formatKeyValueBlock(input.rig)}`);
  }

  // 7. Spoiler Warning
  if (input.spoilerWarning) {
    sections.push(t("description.sections.spoilerWarning"));
  }

  // 8. Mature Warning
  if (input.matureWarning) {
    sections.push(t("description.sections.matureWarning"));
  }

  // 9. Donate Links
  const donateFields = ["kofi", "patreon", "buymeacoffee", "paypal", "streamlabs"];
  const donateLinks = Object.entries(input.social)
    .filter(([k, v]) => donateFields.includes(k) && v && v.trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  if (donateLinks) {
    sections.push(`${t("description.sections.donate")}\n${donateLinks}`);
  }

  // 10. Social Links
  const socialFields = ["github", "twitter", "discord", "twitch", "tiktok", "instagram", "website"];
  const socialLinks = Object.entries(input.social)
    .filter(([k, v]) => socialFields.includes(k) && v && v.trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  if (socialLinks) {
    sections.push(`${t("description.sections.social")}\n${socialLinks}`);
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
  const gameTag = `#${gameName.replace(/\s+/g, "")}`;
  const genreTag = `#${input.genre}`;
  sections.push(`${gameTag} #GameplayNoCommentary ${genreTag}`);

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
