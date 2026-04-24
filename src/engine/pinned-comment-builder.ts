import type { GeneratorInput, TranslationFn } from "./types";

export interface BuildPinnedCommentOptions {
  /**
   * When true, include the "what should I play next?" prompt. Creators
   * who run a fixed series (e.g. a single long-form playthrough) may
   * turn this off to avoid the question feeling out of place.
   */
  includeAskNextGame?: boolean;
  /**
   * When true and `input.playlistLink` is set, the template includes a
   * "watch the full series here" line pointing at the playlist.
   */
  includePlaylistLink?: boolean;
}

/**
 * Composes a localized pinned-comment template from a handful of
 * reusable sub-keys plus a per-video-type greeting. Pure — no store
 * access, no React, no DOM.
 *
 * Design:
 * - Four shared sub-keys (`thanksForWatching`, `playlistPrompt`,
 *   `engagementPrompt`, `askNextGame`) keep the bulk of the translator
 *   burden small — a locale only has to translate these once.
 * - One greeting per video type (`pinnedComment.greetings.<videoType>`)
 *   adds per-type nuance (boss vs ending vs speedrun read differently
 *   to a viewer, even though the CTA is the same).
 * - Missing per-type greeting → fall back to `greetings.part`, which is
 *   the most generic shape ("Welcome back to {{gameName}} …"). If even
 *   that is absent, the greeting line is dropped rather than leaving a
 *   raw key visible in the output.
 * - Returns `""` when the composed result would be only whitespace so
 *   callers can cleanly check `if (pinned) { … }`.
 */
export function buildPinnedComment(
  input: GeneratorInput,
  t: TranslationFn,
  options: BuildPinnedCommentOptions = {},
): string {
  const { includeAskNextGame = true, includePlaylistLink = true } = options;
  const gameName = input.gameNameLocalized?.[input.language] ?? input.gameName;

  const vars: Record<string, string> = {
    gameName,
    channelName: input.channelName,
  };

  // Greeting — per-video-type first, then `part` fallback, then drop.
  const greetingKey = `pinnedComment.greetings.${input.videoType}`;
  const greetingResolved = t(greetingKey, vars);
  let greeting = greetingResolved === greetingKey ? "" : greetingResolved;
  if (!greeting) {
    const fallbackKey = "pinnedComment.greetings.part";
    const fallback = t(fallbackKey, vars);
    if (fallback !== fallbackKey) greeting = fallback;
  }

  const lines: string[] = [];
  if (greeting.trim()) lines.push(greeting);

  const thanks = t("pinnedComment.thanksForWatching");
  if (thanks && thanks !== "pinnedComment.thanksForWatching") lines.push(thanks);

  if (includePlaylistLink && input.playlistLink && input.playlistLink.trim()) {
    const playlist = t("pinnedComment.playlistPrompt", {
      link: input.playlistLink.trim(),
    });
    if (playlist && playlist !== "pinnedComment.playlistPrompt") lines.push(playlist);
  }

  const engagement = t("pinnedComment.engagementPrompt");
  if (engagement && engagement !== "pinnedComment.engagementPrompt") lines.push(engagement);

  if (includeAskNextGame) {
    const ask = t("pinnedComment.askNextGame");
    if (ask && ask !== "pinnedComment.askNextGame") lines.push(ask);
  }

  return lines.filter((l) => l.trim() !== "").join("\n\n");
}
