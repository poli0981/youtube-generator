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

/**
 * Locale-aware short formatter for the livestream `scheduledTime` field.
 * The editor stores ISO strings (`<input type="datetime-local">` output);
 * we render them as "Sat, May 2, 8:00 PM" in en, and equivalent native
 * forms elsewhere via `Intl.DateTimeFormat`. Falls back to the raw input
 * if it can't be parsed — better than emitting "Invalid Date".
 */
function formatScheduledTime(iso: string, language: string): string {
  const trimmed = iso.trim();
  if (!trimmed) return "";
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  try {
    return new Intl.DateTimeFormat(language, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return trimmed;
  }
}

/**
 * Brand names by GPU vendor — kept in English on purpose. These are
 * trademarked product names viewers are searching for verbatim ("DLSS",
 * "FSR", "XeSS"); translating them would hurt SEO. Frame-gen branding
 * is similarly fixed: "Frame Generation" (NVIDIA), "Fluid Motion Frames"
 * (AMD's official term), "XeFG" (Intel's announced FG tech).
 */
const VENDOR_GFX_BRANDS: Record<
  "nvidia" | "amd" | "intel",
  { upscale: string; framegen: string }
> = {
  nvidia: { upscale: "NVIDIA DLSS", framegen: "NVIDIA Frame Generation" },
  amd: { upscale: "AMD FSR", framegen: "AMD Fluid Motion Frames" },
  intel: { upscale: "Intel XeSS", framegen: "Intel XeFG" },
};

/**
 * Compose the third token of the "🖥 VIDEO SETTINGS" line — e.g.
 * `Cinematic Setting - NVIDIA Frame Generation x2 with Ray Tracing`.
 *
 * Returns an empty string when nothing meaningful can be said (no preset
 * label AND no modifiers AND no RT modes); the caller treats that as
 * "skip this token" rather than emitting an awkward bare string.
 */
function composeGraphicsPart(input: GeneratorInput, t: TranslationFn): string {
  // 1. Preset label — `"custom"` reads from the free-form slot; everything
  //    else goes through i18n. Missing translation falls back to nothing
  //    rather than leaking the raw key.
  let presetLabel = "";
  if (input.graphicsPreset === "custom") {
    presetLabel = (input.graphicsPresetCustom ?? "").trim();
  } else if (input.graphicsPreset) {
    const key = `description.graphics.presetOptions.${input.graphicsPreset}`;
    const resolved = t(key);
    if (resolved && resolved !== key) presetLabel = resolved;
  }

  // 2. Modifier (upscale + frame-gen). Vendor gates the whole clause —
  //    upscaling/frame-gen quality without a vendor is meaningless.
  const vendor =
    input.frameGenVendor && input.frameGenVendor !== "none"
      ? input.frameGenVendor
      : null;
  const upscaleQ =
    input.upscaleQuality && input.upscaleQuality !== "none"
      ? input.upscaleQuality
      : null;
  const fgMul =
    input.frameGenMultiplier && input.frameGenMultiplier !== "none"
      ? input.frameGenMultiplier
      : null;

  let modifier = "";
  if (vendor) {
    const brands = VENDOR_GFX_BRANDS[vendor];
    const parts: string[] = [];
    if (upscaleQ) {
      const qLabel = t(`description.graphics.upscaleQualityOptions.${upscaleQ}`);
      parts.push(`${brands.upscale} ${qLabel}`);
    }
    if (fgMul) {
      // When upscaling is also present, just say "Frame Generation x2"
      // without re-stating the brand — the upscaler already established
      // it. Otherwise spell out "NVIDIA Frame Generation x2".
      parts.push(parts.length > 0 ? `Frame Generation ${fgMul}` : `${brands.framegen} ${fgMul}`);
    }
    modifier = parts.join(" + ");
  }

  // 3. Ray-tracing clause. Each mode runs through i18n; falls back to
  //    the snake_case id if a locale hasn't translated it.
  const rtModes = input.rayTracingModes ?? [];
  let rtClause = "";
  if (rtModes.length > 0) {
    const labels = rtModes.map((m) => {
      const key = `description.graphics.rtOptions.${m}`;
      const resolved = t(key);
      return resolved === key ? m : resolved;
    });
    rtClause = ` ${t("description.graphics.with")} ${labels.join(", ")}`;
  }

  if (!presetLabel && !modifier && !rtClause) return "";
  if (!presetLabel) {
    // No anchor preset (e.g. `custom` with empty free-form): fall back
    // to just the modifier + RT clause, trimmed.
    return `${modifier}${rtClause}`.trim();
  }
  const settingSuffix = t("description.graphics.settingSuffix");
  const head = `${presetLabel} ${settingSuffix}`;
  const middle = modifier ? ` - ${modifier}` : "";
  return `${head}${middle}${rtClause}`;
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

  // 1.25 Livestream metadata — only emitted for livestream-type videos
  // when at least one of `liveUrl` / `scheduledTime` is set. Sits right
  // after the intro so viewers can grab the live link before scrolling
  // through the rest of the description.
  if (input.videoType === "livestream") {
    const lines: string[] = [];
    if (input.scheduledTime && input.scheduledTime.trim()) {
      const formatted = formatScheduledTime(input.scheduledTime, input.language);
      const line = t("description.livestream.scheduledLine", { time: formatted });
      if (line && line !== "description.livestream.scheduledLine") lines.push(line);
    }
    if (input.liveUrl && input.liveUrl.trim()) {
      const line = t("description.livestream.watchLine", { link: input.liveUrl.trim() });
      if (line && line !== "description.livestream.watchLine") lines.push(line);
    }
    if (lines.length > 0) sections.push(lines.join("\n"));
  }

  // 1.5 Playthrough status — surfaces "is this a blind run / NG+ / …"
  // right after the intro because that context frames how viewers read
  // everything below. Skipped when creator hasn't picked a value.
  if (input.playthroughStatus && input.playthroughStatus !== "none") {
    const label = t(`description.playthrough.${input.playthroughStatus}`);
    sections.push(t("description.sections.playthrough", { value: label }));
  }

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

  // 5. Video Settings — skipped entirely for 2D / pixel-art / no-in-game-
  //    settings games (the user toggles that explicitly; v0.8 phase 2 also
  //    auto-suggests it on certain genres but the toggle is the source of
  //    truth at render time).
  if (!input.skipGraphicsSettings) {
    const settings: string[] = [];
    if (input.resolution) settings.push(input.resolution);
    if (input.fps) settings.push(`${input.fps} FPS`);
    const gfxPart = composeGraphicsPart(input, t);
    if (gfxPart) settings.push(gfxPart);
    if (input.artStyle && input.artStyle !== "none") {
      const styleKey = `description.graphics.artStyleOptions.${input.artStyle}`;
      const styleLabel = t(styleKey);
      if (styleLabel && styleLabel !== styleKey) {
        settings.push(`${t("description.graphics.artStyle")}: ${styleLabel}`);
      }
    }
    if (input.versionInfo && input.versionInfo.trim()) {
      settings.push(input.versionInfo.trim());
    }
    if (settings.length > 0) {
      sections.push(`${t("description.sections.videoSettings")}\n${settings.join(" | ")}`);
    }
  }

  // 5.5 Difficulty — sits with Video Settings because a difficulty
  // choice is another gameplay setting, not a content warning. For
  // `"custom"`, the user's free-form label is used verbatim (not
  // translated — intentional: lets creators use game-specific names
  // like "Lethal" without per-locale fallback friction).
  if (input.difficulty && input.difficulty !== "none") {
    const value =
      input.difficulty === "custom"
        ? (input.difficultyCustomLabel ?? "").trim()
        : t(`description.difficulty.${input.difficulty}`);
    if (value) {
      sections.push(`${t("description.sections.difficulty")}\n${value}`);
    }
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

  // 7.5 Content warnings — accessibility block. Rendered as a bulleted
  // list so viewers using screen readers or avoiding triggers can scan
  // quickly. Each warning has its own emoji bullet (⚡ / 🔊 / 😱) and a
  // localised label. Empty array → skipped, matching the behaviour for
  // every other opt-in section.
  if (input.contentWarnings && input.contentWarnings.length > 0) {
    const bullets = input.contentWarnings
      .map((w) => t(`description.contentWarnings.${w}`))
      .filter((line) => line && line.trim() !== "")
      .map((line) => `• ${line}`)
      .join("\n");
    if (bullets) {
      sections.push(`${t("description.sections.contentWarnings")}\n${bullets}`);
    }
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
