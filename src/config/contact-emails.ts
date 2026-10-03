import type { EditorData } from "@store/editor-store";

/**
 * Purpose words for the split contact emails (v1.1.0).
 *
 * With Settings › "Split contact email by purpose" on, every purpose-specific
 * address has to say what it is for: the part before `@` must contain one of
 * the field's words. Matched case-insensitively anywhere in that part, so
 * `sponsorships@…`, `DMCA.team@…` and Gmail's plus-addressing
 * (`name+dmca@gmail.com`) all count. The general Contact address has no rule.
 *
 * Shown to the user verbatim (help text and errors), in this order.
 */
export const PURPOSE_EMAIL_KEYWORDS = {
  adEmail: [
    "sponsor",
    "ads",
    "advert",
    "business",
    "biz",
    "partner",
    "collab",
    "brand",
    "marketing",
    "promo",
  ],
  gameKeyEmail: [
    "key",
    "game",
    "gaming",
    "press",
    "media",
    "review",
    "playtest",
    "beta",
    "curator",
  ],
  copyrightEmail: ["dmca", "takedown", "copyright", "legal", "rights", "claim"],
} as const satisfies Partial<Record<keyof EditorData, readonly string[]>>;

export type PurposeEmailField = keyof typeof PURPOSE_EMAIL_KEYWORDS;
