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
