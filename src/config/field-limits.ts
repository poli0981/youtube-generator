import { YT_LIMITS } from "@engine/types";

/**
 * Maximum length of every free-text field in the editor.
 *
 * Until v0.35.0 no input in the app had a cap at all: `maxLength` appeared
 * nowhere in the codebase. A pasted novel in the game-name field produced a
 * title YouTube would reject, and a 4 KB "URL" silently rode along into the
 * description.
 *
 * Caps are grouped by the *kind* of thing a field holds, not per field, so a
 * new input inherits a sensible limit by picking the closest category instead
 * of inventing a number. All values are UTF-16 code units, matching the DOM
 * `maxLength` attribute — an emoji costs 2 and a flag emoji 4. That is a
 * deliberate simplification: grapheme counting would be more "correct" but
 * cannot be enforced by the browser, and these are generous ceilings meant to
 * stop absurd input, not to budget characters precisely.
 */
export const FIELD_LIMITS = {
  /**
   * Store pages, social profiles, playlists, community invites. The longest
   * realistic value in the app's own inventory is a Signal group invite
   * (`https://signal.group/#<base64>`) at roughly 120 characters.
   */
  URL: 200,

  /**
   * Up to three comma-separated addresses. RFC 5321 caps a single address at
   * 254, so 200 would be too tight for even one worst-case address; 320 fits
   * three ordinary ones with room to spare while still rejecting a paste of
   * an entire contact list.
   */
  EMAIL_FIELD: 320,

  /**
   * Game names, channel names, boss / chapter / DLC names, sponsor names,
   * hardware model strings, profile and preset names. The longest real game
   * titles run to roughly 50 characters.
   */
  SHORT_NAME: 100,

  /** Custom labels and version strings — a phrase, not a sentence. */
  LABEL: 300,

  /**
   * Music attribution, mod lists, pinned comments, thumbnail text, sponsor
   * blurbs, playlist notes. Long enough for a real credits block, short
   * enough that no single field can consume the whole description budget.
   */
  LONG_TEXT: 2000,

  /**
   * The timestamps field is the one input that legitimately holds a whole
   * chapter list. Capped at the YouTube description limit because a longer
   * value could only ever produce a description that is already over budget
   * and blocked from copying.
   */
  TIMESTAMPS: YT_LIMITS.DESCRIPTION_MAX,

  /** Part numbers, years, counts. Ten digits is already absurd for these. */
  NUMERIC: 10,
} as const;

export type FieldLimitKey = keyof typeof FIELD_LIMITS;

/**
 * Truncate a value to `max`.
 *
 * The DOM `maxLength` attribute only constrains *typing and pasting*. Values
 * arriving programmatically — a profile / preset / template import, a
 * store-link paste that auto-fills the game name, a hand-edited settings JSON
 * — bypass it entirely. Run those through here, or the cap is decorative.
 */
export function clampField(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}
