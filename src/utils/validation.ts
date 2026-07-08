const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

const URL_REGEX =
  /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+([/?#].*)?$/;

const MAX_EMAILS = 3;

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

export function validateUrlWithPrefix(
  input: string,
  expectedPrefix: string,
): ValidationResult {
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
export function validateUrlWithPattern(
  input: string,
  pattern: RegExp,
): ValidationResult {
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
 * - Messenger community: `https://m.me/<id>` — the id is a page username or
 *   numeric page id. Non-`m.me` URLs are hard-rejected so a broken invite
 *   never reaches the description.
 * - Zalo group: `https://zalo.me/g/<code>` — the `/g/` path is the group
 *   join link, distinct from a personal `zalo.me/<phone>` profile. Only
 *   rendered for Vietnamese output, but validated regardless of language.
 */
const MESSENGER_URL_REGEX = /^https:\/\/m\.me\/[A-Za-z0-9._-]+$/;
const MESSENGER_URL_EXPECTED = "https://m.me/[id]";
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
