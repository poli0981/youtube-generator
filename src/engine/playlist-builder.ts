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
}

export interface PlaylistOutput {
  title: string;
  description: string;
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
