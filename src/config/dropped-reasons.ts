/**
 * Predefined "why was this playlist dropped" reasons (v0.31.0).
 *
 * Drives the Playlist Generator's dropped-reason multi-select, shown only
 * when the playlist status is "dropped". Each id maps to a localized label
 * under `playlist.droppedReasons.<id>` in BOTH the `ui` namespace (the
 * selection chips) and the `templates` namespace (the rendered output) —
 * the same split used by content warnings. The list is a starting point,
 * just plain constants free to tune; the editor's free-text "other reason"
 * field covers anything not listed here.
 */
export const DROPPED_REASONS = [
  { id: "boring", icon: "😴" },
  { id: "performance", icon: "🐌" },
  { id: "bugs", icon: "🐛" },
  { id: "delisted", icon: "🗑️" },
  { id: "low_views", icon: "📉" },
  { id: "time", icon: "⏳" },
] as const;

export type DroppedReasonId = (typeof DROPPED_REASONS)[number]["id"];
