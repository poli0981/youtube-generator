import type { TranslationFn } from "./types";
import { PLATFORMS } from "@config/platforms";

export type PlaylistStatus = "completed" | "dropped" | "incomplete" | "in_progress";

export type PlaylistContentType =
  | "full_gameplay"
  | "boss_fights"
  | "speedrun"
  | "all_endings"
  | "dlc"
  | "100_percent"
  | "guide"
  | "highlights";

export interface PlaylistInput {
  gameName: string;
  channelName: string;
  status: PlaylistStatus;
  contentType: PlaylistContentType;
  totalVideos?: number;
  storeLinks?: Partial<Record<string, string>>;
  playlistNote?: string;
  /**
   * Selected dropped-reason ids (see `@config/dropped-reasons`). Only
   * rendered when {@link status} is "dropped". v0.31.0
   */
  droppedReasons?: string[];
  /** Free-text custom dropped reason, appended after the predefined ones. v0.31.0 */
  droppedReasonCustom?: string;
  /**
   * Playlist URL, reused from the editor store — drives the pinned-comment
   * "watch the full playlist" line. Empty/absent omits the line. v0.31.0
   */
  playlistLink?: string;
}

/**
 * Dropped-reason bullet lines, shared by the description and the comment.
 * Empty unless the playlist is actually dropped. Each predefined id resolves
 * via `playlist.droppedReasons.<id>`; an unresolved key (missing translation)
 * is skipped rather than printed raw. The free-text custom reason, when set,
 * is appended last.
 */
function buildDroppedReasonBullets(input: PlaylistInput, t: TranslationFn): string[] {
  if (input.status !== "dropped") return [];
  const bullets: string[] = [];
  for (const id of input.droppedReasons ?? []) {
    const key = `playlist.droppedReasons.${id}`;
    const label = t(key);
    if (label && label !== key) bullets.push(`• ${label}`);
  }
  const custom = input.droppedReasonCustom?.trim();
  if (custom) bullets.push(`• ${custom}`);
  return bullets;
}

export function buildPlaylistTitle(input: PlaylistInput, t: TranslationFn): string {
  const statusText = t(`playlist.status.${input.status}`);
  return t("playlist.titleFormat", {
    status: statusText,
    gameName: input.gameName,
  });
}

export function buildPlaylistDescription(input: PlaylistInput, t: TranslationFn): string {
  const lines: string[] = [];

  lines.push(
    t(`playlist.description.${input.contentType}`, {
      gameName: input.gameName,
      channelName: input.channelName,
    }),
  );

  lines.push("");

  // Dropped reasons (v0.31.0) — only when the series is marked dropped and
  // at least one reason (predefined or custom) is present.
  const droppedBullets = buildDroppedReasonBullets(input, t);
  if (droppedBullets.length > 0) {
    lines.push(t("playlist.droppedHeading"));
    lines.push(...droppedBullets);
    lines.push("");
  }

  if (input.totalVideos && input.totalVideos > 0) {
    lines.push(t("playlist.videoCount", { count: String(input.totalVideos) }));
    lines.push("");
  }

  if (input.storeLinks) {
    const storeEntries = Object.entries(input.storeLinks).filter(
      ([, url]) => url && url.trim() !== "",
    );
    if (storeEntries.length > 0) {
      lines.push(t("playlist.storeSection"));
      for (const [id, url] of storeEntries) {
        const platform = PLATFORMS.find((p) => p.id === id);
        lines.push(`🎮 ${platform?.label ?? id}: ${url}`);
      }
      lines.push("");
    }
  }

  if (input.playlistNote?.trim()) {
    lines.push(input.playlistNote.trim());
    lines.push("");
  }

  lines.push(t("playlist.footer"));

  return lines.join("\n");
}

/**
 * Pinned-comment template for the playlist's most-recent video (v0.31.0).
 * Status-adaptive: the opening line changes per status, and a dropped
 * playlist appends its reasons. Mirrors {@link buildPinnedComment}'s idioms
 * — sub-key composition, `t(key) === key` missing-key fallback, blocks
 * joined by a blank line, "" when nothing renders. Pure.
 */
export function buildPlaylistComment(input: PlaylistInput, t: TranslationFn): string {
  const blocks: string[] = [];

  const openingKey = `playlist.comment.opening.${input.status}`;
  const opening = t(openingKey, { gameName: input.gameName });
  if (opening && opening !== openingKey) blocks.push(opening);

  if (input.totalVideos && input.totalVideos > 0) {
    const count = t("playlist.videoCount", { count: String(input.totalVideos) });
    if (count && count !== "playlist.videoCount") blocks.push(count);
  }

  const link = input.playlistLink?.trim();
  if (link) {
    const linkLine = t("playlist.comment.playlistPrompt", { link });
    if (linkLine && linkLine !== "playlist.comment.playlistPrompt") blocks.push(linkLine);
  }

  const droppedBullets = buildDroppedReasonBullets(input, t);
  if (droppedBullets.length > 0) {
    const introKey = "playlist.comment.droppedReasonsIntro";
    const intro = t(introKey);
    const introLine = intro && intro !== introKey ? `${intro}\n` : "";
    blocks.push(`${introLine}${droppedBullets.join("\n")}`);
  }

  const engagement = t("playlist.comment.engagement");
  if (engagement && engagement !== "playlist.comment.engagement") blocks.push(engagement);

  return blocks.filter((b) => b.trim() !== "").join("\n\n");
}
