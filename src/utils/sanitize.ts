/**
 * Strip every character that is not a Unicode letter or digit.
 *
 * Used to turn a free-form game name or genre id into a valid hashtag body.
 * Spaces, punctuation, separators, and emoji are all removed; accented
 * letters and non-Latin scripts are preserved via `\p{L}` / `\p{N}`.
 *
 *   "S.T.A.L.K.E.R. 2"     -> "STALKER2"
 *   "Yakuza: Like a Dragon"-> "YakuzaLikeaDragon"
 *   "visual_novel"         -> "visualnovel"
 *   "仁王 2"                -> "仁王2"
 */
export function sanitizeHashtag(name: string): string {
  return name.normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "");
}

/**
 * Turn a snake_case identifier into a space-separated, human-readable form.
 * Used for free-text tag strings where the id would otherwise leak as-is.
 *
 *   "visual_novel"    -> "visual novel"
 *   "survival_craft"  -> "survival craft"
 */
export function humanizeId(id: string): string {
  return id.replace(/_/g, " ");
}
