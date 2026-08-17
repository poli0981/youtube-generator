const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const URL_REGEX =
  /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+([/?#].*)?$/;

export const MAX_EMAILS = 3;

/**
 * How many addresses a comma-separated email field currently holds.
 *
 * Trailing and empty segments don't count, so `"a@b.com,"` is one address —
 * the state you are in the instant after typing the separator for the next
 * one. Shared by the validator and the input guard so "how many is that?"
 * has exactly one answer.
 */
export function countEmailSegments(input: string): number {
  return input
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean).length;
}

/**
 * Should this change to an email field be accepted?
 *
 * The cap is enforced on the *increase*, not on the absolute count. Two
 * consequences, both deliberate:
 *
 *  - A field that already holds four addresses (from an older profile, or a
 *    hand-edited import) stays editable — the user can still delete down to
 *    three. A flat `count > max` reject would freeze it permanently.
 *  - A half-typed address is never punished. `"a@b.com,c@"` is two segments,
 *    so the guard stays quiet and the ordinary format validator handles it.
 */
export function canAcceptEmailInput(next: string, prev: string, max = MAX_EMAILS): boolean {
  const nextCount = countEmailSegments(next);
  return nextCount <= max || nextCount <= countEmailSegments(prev);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  errorParams?: Record<string, string | number>;
}

export function validateEmails(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  const emails = trimmed
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  // Still enforced here as well as at the input: `canAcceptEmailInput` guards
  // typing, but a value can also arrive from a profile / preset / template
  // import, which never passes through an input at all.
  if (emails.length > MAX_EMAILS) {
    return {
      valid: false,
      error: "validation.emailMaxExceeded",
      errorParams: { max: MAX_EMAILS, count: emails.length },
    };
  }

  for (const email of emails) {
    if (!EMAIL_REGEX.test(email)) {
      return {
        valid: false,
        error: "validation.emailInvalid",
        errorParams: { email },
      };
    }
  }

  return { valid: true };
}

export function validateUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  if (!URL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "validation.urlInvalid",
    };
  }

  return { valid: true };
}

export function validateUrlWithPrefix(input: string, expectedPrefix: string): ValidationResult {
  const baseResult = validateUrl(input);
  if (!baseResult.valid) return baseResult;

  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  if (expectedPrefix && !trimmed.startsWith(expectedPrefix)) {
    return {
      valid: true,
      error: "validation.urlPrefixMismatch",
      errorParams: { expected: expectedPrefix },
    };
  }

  return { valid: true };
}

/**
 * Validate a URL against a platform-specific RegExp. Unlike
 * validateUrlWithPrefix, prefix-style mismatches are treated as hard
 * errors so invalid links can be kept out of the output.
 */
export function validateUrlWithPattern(input: string, pattern: RegExp): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  const baseResult = validateUrl(trimmed);
  if (!baseResult.valid) return baseResult;

  if (!pattern.test(trimmed)) {
    return { valid: false, error: "validation.urlInvalid" };
  }

  return { valid: true };
}

/**
 * Strict validator for YouTube playlist URLs. The output description and
 * the genre-playlist suggestion in the pinned-comment template both rely
 * on the link being a real `?list=…` playlist URL — accepting a video URL
 * (`watch?v=…`) here would produce broken output.
 *
 * v0.8.1: relaxed from the v0.8 shape so real share URLs go through:
 * - `www.` is optional (YouTube emits both `www.youtube.com` and
 *   `youtube.com` depending on context).
 * - `list=` may sit anywhere in the query string and be flanked by
 *   other params (`si=…`, `pp=…`, `index=…`, etc.).
 * - A trailing fragment (`#…`) is tolerated.
 *
 * `watch?v=…` URLs and `youtu.be/…` short links remain rejected because
 * the path must be exactly `/playlist`.
 */
const YT_PLAYLIST_REGEX =
  /^https:\/\/(?:www\.)?youtube\.com\/playlist\?(?:[^#]*&)?list=[A-Za-z0-9_-]+(?:&[^#]*)?(?:#.*)?$/;
const PLAYLIST_URL_EXPECTED = "https://www.youtube.com/playlist?list=[id]";

export function validatePlaylistUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  const baseResult = validateUrl(trimmed);
  if (!baseResult.valid) return baseResult;

  if (!YT_PLAYLIST_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "validation.playlistUrlInvalid",
      errorParams: { expected: PLAYLIST_URL_EXPECTED },
    };
  }

  return { valid: true };
}

/**
 * Strict validators for community-invite links (v0.32.0).
 *
 * - Messenger community: `https://m.me/ch/<id>` — the `/ch/` path is the
 *   community/channel invite (distinct from a personal `m.me/<page>` link).
 *   A trailing slash is allowed. Non-matching URLs are hard-rejected so a
 *   broken invite never reaches the description.
 * - Zalo group: `https://zalo.me/g/<code>` — the `/g/` path is the group
 *   join link, distinct from a personal `zalo.me/<phone>` profile. Only
 *   rendered for Vietnamese output, but validated regardless of language.
 */
const MESSENGER_URL_REGEX = /^https:\/\/m\.me\/ch\/[A-Za-z0-9._-]+\/?$/;
const MESSENGER_URL_EXPECTED = "https://m.me/ch/[id]";
const ZALO_GROUP_URL_REGEX = /^https:\/\/zalo\.me\/g\/[A-Za-z0-9]+$/;
const ZALO_GROUP_URL_EXPECTED = "https://zalo.me/g/[id]";

export function validateMessengerUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  const baseResult = validateUrl(trimmed);
  if (!baseResult.valid) return baseResult;

  if (!MESSENGER_URL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "validation.messengerUrlInvalid",
      errorParams: { expected: MESSENGER_URL_EXPECTED },
    };
  }

  return { valid: true };
}

export function validateZaloGroupUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  const baseResult = validateUrl(trimmed);
  if (!baseResult.valid) return baseResult;

  if (!ZALO_GROUP_URL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "validation.zaloUrlInvalid",
      errorParams: { expected: ZALO_GROUP_URL_EXPECTED },
    };
  }

  return { valid: true };
}

/**
 * Strict validators for the v0.33.0 community-invite links. Same shape as
 * the Messenger / Zalo validators above: empty is valid (optional field),
 * the base URL check runs first, then a platform-specific pattern that is
 * hard-rejected so a broken invite never reaches the description.
 *
 * - Signal group: `https://signal.group/#<payload>` — the `#` fragment is
 *   the base64 group-invite blob (may contain `+ / = _ -`).
 * - Instagram group chat: `https://www.instagram.com/j/<id>` or the short
 *   `https://ig.me/j/<id>` form — distinct from an `instagram.com/<user>`
 *   profile link, which stays in the Social section.
 * - Facebook group: `https://facebook.com/groups/<id>` — the `www.`, `m.`
 *   and `web.` subdomains and a trailing slash are tolerated. This moved
 *   out of the generic Social map (which used a soft prefix warning) into
 *   the Community section, so it now hard-rejects like its siblings.
 */
const SIGNAL_GROUP_URL_REGEX = /^https:\/\/signal\.group\/#[A-Za-z0-9+/=_-]+$/;
const SIGNAL_GROUP_URL_EXPECTED = "https://signal.group/#[id]";
const INSTAGRAM_INVITE_URL_REGEX =
  /^https:\/\/(?:www\.instagram\.com|ig\.me)\/j\/[A-Za-z0-9._-]+\/?$/;
const INSTAGRAM_INVITE_URL_EXPECTED = "https://www.instagram.com/j/[id]";
const FACEBOOK_GROUP_URL_REGEX =
  /^https:\/\/(?:www\.|m\.|web\.)?facebook\.com\/groups\/[A-Za-z0-9._-]+\/?$/;
const FACEBOOK_GROUP_URL_EXPECTED = "https://facebook.com/groups/[id]";

export function validateSignalGroupUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  const baseResult = validateUrl(trimmed);
  if (!baseResult.valid) return baseResult;

  if (!SIGNAL_GROUP_URL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "validation.signalUrlInvalid",
      errorParams: { expected: SIGNAL_GROUP_URL_EXPECTED },
    };
  }

  return { valid: true };
}

export function validateInstagramInviteUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  const baseResult = validateUrl(trimmed);
  if (!baseResult.valid) return baseResult;

  if (!INSTAGRAM_INVITE_URL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "validation.instagramInviteUrlInvalid",
      errorParams: { expected: INSTAGRAM_INVITE_URL_EXPECTED },
    };
  }

  return { valid: true };
}

export function validateFacebookGroupUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: true };

  const baseResult = validateUrl(trimmed);
  if (!baseResult.valid) return baseResult;

  if (!FACEBOOK_GROUP_URL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "validation.facebookGroupUrlInvalid",
      errorParams: { expected: FACEBOOK_GROUP_URL_EXPECTED },
    };
  }

  return { valid: true };
}

export interface IntRangeOptions {
  min: number;
  max: number;
  /** When true, an empty / whitespace-only string is valid (the field is
   *  optional). When false, blank is rejected as `validation.numberRequired`. */
  allowEmpty?: boolean;
}

/**
 * Validate that a string holds a whole number within `[min, max]`.
 * Rejects (in order) blank-when-required, non-numeric, decimals /
 * non-integers, and out-of-range values — covering every "invalid number"
 * case the editor needs to warn on (v0.30.0). Pure; returns the shared
 * {@link ValidationResult} so it slots into the existing inline-error UI.
 */
export function validateIntegerInRange(
  input: string,
  { min, max, allowEmpty = false }: IntRangeOptions,
): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return allowEmpty ? { valid: true } : { valid: false, error: "validation.numberRequired" };
  }

  const n = Number(trimmed);
  if (!Number.isFinite(n)) {
    return { valid: false, error: "validation.numberInvalid" };
  }
  if (!Number.isInteger(n)) {
    return { valid: false, error: "validation.numberNotInteger" };
  }
  if (n < min || n > max) {
    return {
      valid: false,
      error: "validation.numberOutOfRange",
      errorParams: { min, max },
    };
  }

  return { valid: true };
}

export interface BatchRangeOptions {
  /** Maximum number of parts allowed in a single batch (inclusive span). */
  maxSpan: number;
}

/**
 * Validate a Batch / Social-bulk "start → end part" range. Both endpoints
 * must be whole numbers ≥ 1, `end ≥ start`, and the inclusive span must not
 * exceed `maxSpan`. Returns the first failing reason so the caller can both
 * block generation (disable the button) and surface the message. v0.30.0.
 */
export function validateBatchRange(
  startStr: string,
  endStr: string,
  { maxSpan }: BatchRangeOptions,
): ValidationResult {
  const startResult = validateIntegerInRange(startStr, { min: 1, max: Number.MAX_SAFE_INTEGER });
  if (!startResult.valid) return startResult;
  const endResult = validateIntegerInRange(endStr, { min: 1, max: Number.MAX_SAFE_INTEGER });
  if (!endResult.valid) return endResult;

  const start = Number(startStr.trim());
  const end = Number(endStr.trim());
  if (end < start) {
    return {
      valid: false,
      error: "validation.rangeEndBeforeStart",
      errorParams: { start, end },
    };
  }
  if (end - start + 1 > maxSpan) {
    return {
      valid: false,
      error: "validation.rangeTooLarge",
      errorParams: { maxSpan },
    };
  }

  return { valid: true };
}
