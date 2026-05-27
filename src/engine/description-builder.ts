import type { GeneratorInput, TranslationFn, CharLimitWarning } from "./types";
import { YT_LIMITS } from "./types";
import { PLATFORMS } from "@config/platforms";
import { SOCIAL_FIELDS } from "@config/social-fields";
import { formatRigValue } from "@config/rig-fields";
import { DEFAULT_GACHA_QUEST_TYPE } from "@config/gacha-quest-types";
import { ordinalSuffix } from "./title-builder";
import { parseTimeline, renderTimeline } from "./timeline-parser";
import { formatEndingEntry, sliceEndingsForVideo } from "./endings-format";
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
 * Compose the value half of the "In-game Setting:" line — e.g.
 * `Cinematic - NVIDIA Frame Generation x2 with Ray Tracing`.
 *
 * The `<label>: ` prefix is added by the caller (so the renderer can
 * emit a multi-line block matching the rig / timestamps style). We drop
 * the legacy "Setting" suffix here — having both the label AND a
 * trailing "Setting" word read as redundant ("In-game Setting: Ultra
 * Setting").
 *
 * Returns an empty string when nothing meaningful can be said (no preset
 * label AND no modifiers AND no RT modes); the caller skips the line.
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
      // v0.11: try the vendor-keyed full label first ("NVIDIA DLAA",
      // "AMD FSR Native AA", "Intel XeSS Ultra Quality"). Fall back to
      // the pre-v0.11 flat key + brand prefix for legacy locales /
      // unmigrated translations. The vendor-keyed label embeds the
      // brand so we don't double-prefix on this path.
      const newKey = `description.graphics.upscale.${vendor}.${upscaleQ}`;
      const newLabel = t(newKey);
      if (newLabel && newLabel !== newKey && newLabel.trim()) {
        parts.push(newLabel);
      } else {
        const legacyKey = `description.graphics.upscaleQualityOptions.${upscaleQ}`;
        const legacyLabel = t(legacyKey);
        if (legacyLabel && legacyLabel !== legacyKey) {
          parts.push(`${brands.upscale} ${legacyLabel}`);
        }
      }
    }
    if (fgMul) {
      // Vendor-keyed full label embeds the brand AND the feature name
      // ("NVIDIA Frame Generation x2", "AMD Fluid Motion Frames x3",
      // "Intel XeFG x2"). Fall back to brand + raw multiplier for
      // pre-v0.11 locales.
      const newKey = `description.graphics.frameGen.${vendor}.${fgMul}`;
      const newLabel = t(newKey);
      if (newLabel && newLabel !== newKey && newLabel.trim()) {
        parts.push(newLabel);
      } else {
        parts.push(`${brands.framegen} ${fgMul}`);
      }
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
  const middle = modifier ? ` - ${modifier}` : "";
  return `${presetLabel}${middle}${rtClause}`;
}

/**
 * Compose the v0.22.0 "Video Style" line — combines the chosen era from
 * `input.videoStyleEra` with the rig's `video_editor` field to produce a
 * single line like `"Edited in 1990s VHS style using DaVinci Resolve 19.1"`.
 *
 * Returns an empty string when:
 *   - `videoStyleEra` is empty / unrecognised
 *   - The era's i18n label can't be resolved (defensive — locale missing
 *     the key shouldn't leak the snake_case id into the description)
 *
 * Picks one of two templates depending on whether the rig's video editor
 * is filled in. The two-template approach keeps localisations natural —
 * each locale can phrase the with/without-editor variants differently.
 */
function composeVideoStyleLine(input: GeneratorInput, t: TranslationFn): string {
  const era = (input.videoStyleEra ?? "").trim();
  if (!era) return "";
  const eraKey = `description.videoSettings.eraOptions.${era}`;
  const eraLabel = t(eraKey);
  if (!eraLabel || eraLabel === eraKey) return "";

  const editor = formatRigValue(
    "video_editor",
    input.rig?.video_editor ?? "",
  ).trim();

  if (editor) {
    return t("description.videoSettings.styleLine", { era: eraLabel, editor });
  }
  return t("description.videoSettings.styleLineNoEditor", { era: eraLabel });
}

export interface BuildDescriptionOptions {
  hashtagCount?: number;
  /** When true and channelName is non-empty, appends an auto-generated
   *  copyright line after the CTA. */
  showCopyright?: boolean;
  /** When true, appends a localised usage-policy block after the
   *  copyright line. */
  showUsagePolicy?: boolean;
  /** When true and `input.pubDevName` is non-empty, emits a single-line
   *  `© {publisher}. All rights reserved.` block right after the Store
   *  Links section. Used when the game's dev/publisher contractually
   *  requires a copyright credit in the description (v0.21.0). Decoupled
   *  from `storeLinks.publisher` — renders even if the publisher URL is
   *  blank, since the obligation is to credit the IP holder by name. */
  showGameCopyright?: boolean;
  /** When true and both `sponsorName` and `sponsorPlatform` are set,
   *  emits a "🎁 Thanks to …" credit line above the music section. */
  showSponsorCredit?: boolean;
  /** When true and the active profile's `thirdPartyAdText` is non-empty,
   *  emits a "🤝 SPONSORS & PARTNERS" block (v0.11). */
  showThirdPartyAds?: boolean;
  /** Optional English-fixed translation function used by the unified
   *  content-warnings block (v0.11) to render bilingual lines
   *  `EN · output-language`. When omitted, the warnings block falls
   *  back to single-language output via `t`. */
  tEn?: TranslationFn;
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
    showThirdPartyAds = false,
    showGameCopyright = false,
    tEn,
  } = options;
  const sections: string[] = [];
  const gameName =
    input.gameNameLocalized?.[input.language] ?? input.gameName;

  // 1. Intro. Gacha videos dispatch on `gachaQuestType` so each of the
  // 17 patterns can frame the description with its own opening line
  // ("World Quest …", "Spiral Abyss endgame", "Dating Event …"). All
  // other video types fall through to the flat `description.intro.<id>`
  // shape that's been around since v0.2.
  let introKey = `description.intro.${input.videoType}`;
  if (input.videoType === "gacha_quest") {
    const questType = input.gachaQuestType ?? DEFAULT_GACHA_QUEST_TYPE;
    introKey = `description.intro.gacha_quest_${questType}`;
  }
  const versionLabel = input.gachaVersion?.trim()
    ? ` (${t("description.intro.versionInline", { v: input.gachaVersion.trim() })})`
    : "";
  const intro = t(introKey, {
    gameName,
    channelName: input.channelName,
    partNumber: input.partNumber ?? "",
    bossName: input.bossName ?? "",
    dlcName: input.dlcName ?? "",
    challengeName: input.challengeName ?? "",
    modName: input.modName ?? "",
    chapterName: input.chapterName ?? "",
    questName: input.questName ?? "",
    characterName: input.characterName ?? "",
    anniversaryYear: input.anniversaryYear != null ? String(input.anniversaryYear) : "",
    ordinalSuffix:
      input.anniversaryYear != null ? ordinalSuffix(input.anniversaryYear) : "",
    gachaVersion: input.gachaVersion ?? "",
    versionLabel,
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

  // 1.5 Playthrough Notes — v0.12 unified block that consolidates the
  // pre-v0.12 standalone "🎯 Playthrough" line and the standalone
  // "🎮 DIFFICULTY" block, plus three new bullets (endings shown,
  // language patch, game version). Sits right after the intro because
  // these facts frame how viewers read everything below. Empty bullets
  // are skipped; if every bullet is empty the whole block is skipped.
  // Bilingual when `tEn` is provided AND output language ≠ English —
  // pattern mirrors the v0.11 content-warnings block.
  const pnBlock = buildPlaythroughNotesSection(input, t, tEn);
  if (pnBlock) sections.push(pnBlock);

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

  // 4.5 Game copyright — opt-in line crediting the dev/publisher right
  //     under the store links (v0.21.0). Decoupled from any specific
  //     store-link URL: as long as `pubDevName` is set AND the toggle is
  //     on, the credit renders. Used by creators who cover games whose
  //     publishers contractually require attribution in the description.
  if (showGameCopyright && input.pubDevName && input.pubDevName.trim()) {
    sections.push(
      t("description.sections.gameCopyright", {
        publisher: input.pubDevName.trim(),
      }),
    );
  }

  // 5. Video Settings — skipped entirely for 2D / pixel-art / no-in-game-
  //    settings games (the user toggles that explicitly; v0.8 phase 2 also
  //    auto-suggests it on certain genres but the toggle is the source of
  //    truth at render time).
  //
  //    v0.8 polish: each token now sits on its own line with a label
  //    ("Video:", "In-game Setting:", "Art Style:", "Version:"), matching
  //    the key-value-per-line shape of the rig and timestamps blocks.
  //    Lines with no value are dropped; if every line is dropped, the
  //    whole section is dropped.
  //
  //    v0.22.0 polish: the optional Video Style line (era + video_editor)
  //    renders inside this section when `skipGraphicsSettings` is off, AND
  //    as a tiny standalone section when it's on — 2D / pixel-art creators
  //    still edit their footage, so the style credit shouldn't disappear
  //    with the graphics block.
  const styleLine = composeVideoStyleLine(input, t);

  if (!input.skipGraphicsSettings) {
    const lines: string[] = [];

    // Capture-side: resolution + FPS, joined with " - " on a single line.
    const captureParts: string[] = [];
    if (input.resolution) captureParts.push(input.resolution);
    if (input.fps) captureParts.push(`${input.fps} FPS`);
    if (captureParts.length > 0) {
      lines.push(`${t("description.graphics.videoLabel")}: ${captureParts.join(" - ")}`);
    }

    // In-game side: preset + modifiers + RT.
    const gfxPart = composeGraphicsPart(input, t);
    if (gfxPart) {
      lines.push(`${t("description.graphics.inGameSettingLabel")}: ${gfxPart}`);
    }

    // Art style — own line so it stays visible alongside the in-game preset.
    if (input.artStyle && input.artStyle !== "none") {
      const styleKey = `description.graphics.artStyleOptions.${input.artStyle}`;
      const styleLabel = t(styleKey);
      if (styleLabel && styleLabel !== styleKey) {
        lines.push(`${t("description.graphics.artStyle")}: ${styleLabel}`);
      }
    }

    // Driver / game version — free-form, own line.
    if (input.versionInfo && input.versionInfo.trim()) {
      lines.push(`${t("description.graphics.versionLabel")}: ${input.versionInfo.trim()}`);
    }

    // v0.22.0 video-style era line — appended last so it reads like a
    // production credit after the technical fields.
    if (styleLine) lines.push(styleLine);

    if (lines.length > 0) {
      sections.push(`${t("description.sections.videoSettings")}\n${lines.join("\n")}`);
    }
  } else if (styleLine) {
    // 2D / pixel-art path: the graphics block is suppressed but the
    // creator still set a style era, so emit a single-line standalone
    // section under the same header.
    sections.push(`${t("description.sections.videoSettings")}\n${styleLine}`);
  }

  // 5.5 Difficulty — moved into the unified Playthrough Notes block
  // above (slot 1.5) in v0.12. Kept here as a no-op placeholder so the
  // numbering of subsequent comments stays stable.

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

  // 6.5 Mod list — only meaningful for the `mods` videoType. Free-form
  // multi-line text the creator pastes from their mod manager (Wabbajack,
  // Vortex, Mod Organizer…). The single-line `modName` field stays in the
  // title / intro for short identification; this block lists the full
  // load order for the description.
  if (
    input.videoType === "mods" &&
    input.modList &&
    input.modList.trim()
  ) {
    sections.push(
      `${t("description.sections.modList")}\n${input.modList.trim()}`,
    );
  }

  // 7. Content warnings — unified bilingual checklist (v0.11). Replaces
  // the v0.7 trio of separate spoiler / generic-content-warnings /
  // mature blocks. Renders header + intro + bulleted list. When the
  // output language is not English, each piece is paired with its
  // English equivalent: header `EN / LOCAL`, intro on two lines,
  // bullets `• EN · LOCAL` (separator is U+00B7 MIDDLE DOT). When
  // `tEn` is omitted (e.g. legacy callers / unit tests that haven't
  // migrated), falls back to single-language output via `t` — degraded
  // but never broken.
  const cw = input.contentWarnings ?? [];
  if (cw.length > 0) {
    const isEn = input.language === "en";
    const renderBilingual = !isEn && Boolean(tEn);
    const tEnUse: TranslationFn = tEn ?? t;

    const headerEn = tEnUse("description.contentWarnings.header");
    const headerLocal = t("description.contentWarnings.header");
    const introEn = tEnUse("description.contentWarnings.intro");
    const introLocal = t("description.contentWarnings.intro");

    const headerLine = renderBilingual ? `${headerEn} / ${headerLocal}` : headerEn;
    const introLines = renderBilingual ? `${introEn}\n${introLocal}` : introEn;

    const bullets = cw
      .map((id) => {
        const key = `description.contentWarnings.items.${id}`;
        const enLabel = tEnUse(key);
        const localLabel = t(key);
        if (!enLabel || enLabel === key || !enLabel.trim()) return null;
        return renderBilingual ? `• ${enLabel} · ${localLabel}` : `• ${enLabel}`;
      })
      .filter((line): line is string => Boolean(line))
      .join("\n");

    if (bullets) {
      sections.push(`${headerLine}\n${introLines}\n\n${bullets}`);
    }
  }

  // 7.5 Tech Notes — v0.12 production / playstyle disclaimer checklist.
  // Sits next to Content Warnings because both are transparency blocks;
  // grouping them keeps disclaimers visually together. Same bilingual
  // render pattern as the content-warnings block above.
  const tnBlock = buildTechNotesSection(input, t, tEn);
  if (tnBlock) sections.push(tnBlock);

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

  // 8.4. Third-party ads — channel-level partner / affiliate / sponsor
  // copy stored on the active profile (v0.11). Multi-line preserved
  // verbatim. Gated on settings toggle AND profile field non-empty;
  // partial state is a no-op so flipping the toggle without filling
  // the profile doesn't sneak an empty section into the description.
  if (
    showThirdPartyAds &&
    input.thirdPartyAdText &&
    input.thirdPartyAdText.trim()
  ) {
    sections.push(
      `${t("description.sections.thirdPartyAds")}\n${input.thirdPartyAdText.trim()}`,
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

  // 9.5 Vietnam donate (bank + e-wallets) — gated on output language
  // because non-Vietnamese viewers don't typically use VN bank
  // transfer / MoMo / ZaloPay. Bank line requires both `vnBankName` and
  // `vnBankAccount`; holder is decorative. Each e-wallet line is
  // independent.
  if (input.language === "vi") {
    const vnLines: string[] = [];
    const bankName = input.vnBankName?.trim() ?? "";
    const bankAccount = input.vnBankAccount?.trim() ?? "";
    const bankHolder = input.vnBankHolder?.trim() ?? "";
    if (bankName && bankAccount) {
      vnLines.push(
        bankHolder
          ? `🏦 ${bankName}: ${bankAccount} (${bankHolder})`
          : `🏦 ${bankName}: ${bankAccount}`,
      );
    }
    const momo = input.vnMomo?.trim() ?? "";
    if (momo) vnLines.push(`💸 MoMo: ${momo}`);
    const zalopay = input.vnZalopay?.trim() ?? "";
    if (zalopay) vnLines.push(`💸 ZaloPay: ${zalopay}`);
    if (vnLines.length > 0) {
      sections.push(`${t("description.sections.vnDonate")}\n${vnLines.join("\n")}`);
    }
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

/**
 * Builds the unified `▸ 🎮 PLAYTHROUGH NOTES` block (v0.12). Combines
 * five bullets (run type, difficulty, endings, language patch, game
 * version) into one section. Each bullet's value is resolved through
 * `t` (localised) plus `tEn` (English fallback) so the rendered line
 * can be bilingual `EN · LOCAL` when the output language ≠ English.
 *
 * Returns "" when every bullet is empty / skipped — caller drops the
 * section entirely instead of emitting a header with no body.
 *
 * Custom string slots (`difficultyCustomLabel`, `languagePatchCustom`,
 * `gameVersionCustom`) are intentionally NOT translated: a creator who
 * types "Lethal" or "Steam Next Fest backer build" wants that label
 * preserved verbatim across locale switches, not run through a
 * non-existent translation key.
 */
function buildPlaythroughNotesSection(
  input: GeneratorInput,
  t: TranslationFn,
  tEn?: TranslationFn,
): string {
  const isEn = input.language === "en";
  const renderBilingual = !isEn && Boolean(tEn);
  const tEnUse: TranslationFn = tEn ?? t;

  /**
   * Resolve a key against both `t` and `tEnUse`, returning a single bullet
   * line. Bullets are formatted as `Label · NhãnLocal: ValueEn · ValueLocal`
   * in bilingual mode and `Label: Value` otherwise. Returns null when the
   * value is empty (caller filters these out).
   */
  function bullet(
    labelKey: string,
    valueEn: string,
    valueLocal: string,
  ): string | null {
    const trimmedEn = valueEn.trim();
    const trimmedLocal = valueLocal.trim();
    if (!trimmedEn && !trimmedLocal) return null;
    const labelEn = tEnUse(labelKey);
    const labelLocal = t(labelKey);
    const labelLine = renderBilingual
      ? `${labelEn} · ${labelLocal}`
      : labelEn;
    const valueLine = renderBilingual
      ? `${trimmedEn || trimmedLocal} · ${trimmedLocal || trimmedEn}`
      : trimmedEn || trimmedLocal;
    return `• ${labelLine}: ${valueLine}`;
  }

  /**
   * Resolve an enum value through i18n. Returns ["", ""] for the
   * skip-sentinel value (caller drops the bullet). Falls back to the raw
   * id if a locale hasn't translated the key — degraded but never
   * "[object Object]".
   */
  function resolveEnum(
    namespace: string,
    value: string,
    skipSentinel: string,
  ): { en: string; local: string } {
    if (!value || value === skipSentinel) return { en: "", local: "" };
    const key = `description.playthroughNotes.${namespace}.${value}`;
    const en = tEnUse(key);
    const local = t(key);
    return {
      en: en === key ? value : en,
      local: local === key ? value : local,
    };
  }

  const bullets: string[] = [];

  // Run type — reads from `playthroughStatus`, looks up the existing
  // v0.7 `description.playthrough.<status>` keys (kept in templates so
  // the migration stays purely about render shape, not value labels).
  if (input.playthroughStatus && input.playthroughStatus !== "none") {
    const key = `description.playthrough.${input.playthroughStatus}`;
    const valueEn = tEnUse(key);
    const valueLocal = t(key);
    const b = bullet(
      "description.playthroughNotes.labels.runType",
      valueEn === key ? input.playthroughStatus : valueEn,
      valueLocal === key ? input.playthroughStatus : valueLocal,
    );
    if (b) bullets.push(b);
  }

  // Difficulty — reads from `difficulty`, with custom slot for
  // free-form labels. Custom labels are passed through verbatim
  // (no translation) on both sides of the bilingual separator.
  if (input.difficulty && input.difficulty !== "none") {
    let valueEn: string;
    let valueLocal: string;
    if (input.difficulty === "custom") {
      const custom = (input.difficultyCustomLabel ?? "").trim();
      valueEn = custom;
      valueLocal = custom;
    } else {
      const key = `description.difficulty.${input.difficulty}`;
      const en = tEnUse(key);
      const local = t(key);
      valueEn = en === key ? input.difficulty : en;
      valueLocal = local === key ? input.difficulty : local;
    }
    const b = bullet(
      "description.playthroughNotes.labels.difficulty",
      valueEn,
      valueLocal,
    );
    if (b) bullets.push(b);
  }

  // Endings shown — v0.16.0 reads from the structured `endings[]` array
  // first; falls back to the legacy `endingsShown` freeform when the
  // array is empty (covers migrated drafts that still carry the legacy
  // string). The structured renderer collapses 1-row "name only"
  // entries to the bare name so the v0.12-era output ("True Ending")
  // is preserved byte-for-byte for single-ending creators.
  //
  // Multi-video slicing: when `endingVideoIndex` is set AND the
  // matching range covers a sub-slice of `endings[]`, only that slice
  // is rendered. Used by the per-video generator pass in Output (one
  // pass per video, each producing its own slice's bullet). When the
  // index is missing / out-of-range, the union of all endings renders
  // — covers case A (single ending) and case B (multi-ending single
  // video) without a special branch.
  const structured = Array.isArray(input.endings) ? input.endings : [];
  const sliced = sliceEndingsForVideo(structured, input);
  if (sliced.length > 0) {
    const formatted = sliced
      .map(formatEndingEntry)
      .filter((s): s is string => !!s);
    if (formatted.length > 0) {
      const joined = formatted.join(", ");
      const b = bullet(
        "description.playthroughNotes.labels.endings",
        joined,
        joined,
      );
      if (b) bullets.push(b);
    }
  } else {
    const legacy = (input.endingsShown ?? "").trim();
    if (legacy) {
      const b = bullet(
        "description.playthroughNotes.labels.endings",
        legacy,
        legacy,
      );
      if (b) bullets.push(b);
    }
  }

  // Language patch — enum + custom slot. `official_other` and `custom`
  // both pull their value from `languagePatchCustom`; the enum-resolved
  // label is used otherwise. `none` is the skip sentinel.
  if (input.languagePatch && input.languagePatch !== "none") {
    let valueEn: string;
    let valueLocal: string;
    if (input.languagePatch === "official_other" || input.languagePatch === "custom") {
      const custom = (input.languagePatchCustom ?? "").trim();
      valueEn = custom;
      valueLocal = custom;
    } else {
      const resolved = resolveEnum("languagePatchOptions", input.languagePatch, "none");
      valueEn = resolved.en;
      valueLocal = resolved.local;
    }
    const b = bullet(
      "description.playthroughNotes.labels.languagePatch",
      valueEn,
      valueLocal,
    );
    if (b) bullets.push(b);
  }

  // Game version — `full_release` is the implicit default and skips
  // the bullet entirely (no need to announce "this is the full game").
  if (input.gameVersion && input.gameVersion !== "full_release") {
    let valueEn: string;
    let valueLocal: string;
    if (input.gameVersion === "custom") {
      const custom = (input.gameVersionCustom ?? "").trim();
      valueEn = custom;
      valueLocal = custom;
    } else {
      const resolved = resolveEnum(
        "gameVersionOptions",
        input.gameVersion,
        "full_release",
      );
      valueEn = resolved.en;
      valueLocal = resolved.local;
    }
    const b = bullet(
      "description.playthroughNotes.labels.gameVersion",
      valueEn,
      valueLocal,
    );
    if (b) bullets.push(b);
  }

  if (bullets.length === 0) return "";

  const headerEn = tEnUse("description.playthroughNotes.header");
  const headerLocal = t("description.playthroughNotes.header");
  const introEn = tEnUse("description.playthroughNotes.intro");
  const introLocal = t("description.playthroughNotes.intro");

  const headerLine = renderBilingual ? `${headerEn} / ${headerLocal}` : headerEn;
  const introLines = renderBilingual ? `${introEn}\n${introLocal}` : introEn;

  return `${headerLine}\n${introLines}\n\n${bullets.join("\n")}`;
}

/**
 * Builds the `▸ 🛠 TECH NOTES` block (v0.12). Renders selected items
 * from {@link GeneratorInput.techNotes} as bulleted bilingual lines —
 * the rendering logic mirrors the v0.11 content-warnings block exactly,
 * just with a different header, intro, and items namespace.
 *
 * Returns "" when no items are selected. Items whose translation key
 * doesn't resolve are filtered out so a stale id from a hand-edited
 * persistent blob doesn't render as a bare key.
 */
function buildTechNotesSection(
  input: GeneratorInput,
  t: TranslationFn,
  tEn?: TranslationFn,
): string {
  const tn = input.techNotes ?? [];
  if (tn.length === 0) return "";

  const isEn = input.language === "en";
  const renderBilingual = !isEn && Boolean(tEn);
  const tEnUse: TranslationFn = tEn ?? t;

  const headerEn = tEnUse("description.techNotes.header");
  const headerLocal = t("description.techNotes.header");
  const introEn = tEnUse("description.techNotes.intro");
  const introLocal = t("description.techNotes.intro");

  const headerLine = renderBilingual ? `${headerEn} / ${headerLocal}` : headerEn;
  const introLines = renderBilingual ? `${introEn}\n${introLocal}` : introEn;

  const bullets = tn
    .map((id) => {
      const key = `description.techNotes.items.${id}`;
      const enLabel = tEnUse(key);
      const localLabel = t(key);
      if (!enLabel || enLabel === key || !enLabel.trim()) return null;
      return renderBilingual ? `• ${enLabel} · ${localLabel}` : `• ${enLabel}`;
    })
    .filter((line): line is string => Boolean(line))
    .join("\n");

  if (!bullets) return "";

  return `${headerLine}\n${introLines}\n\n${bullets}`;
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
