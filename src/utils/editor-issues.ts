import type { EditorData } from "@store/editor-store";
import { PLATFORMS } from "@config/platforms";
import { SOCIAL_FIELDS } from "@config/social-fields";
import { PLAYTEST_PLATFORMS } from "@config/playtest-platforms";
import {
  validateEmails,
  validateUrl,
  validateUrlWithPattern,
  validateUrlWithPrefix,
  validatePlaylistUrl,
  validateMessengerUrl,
  validateZaloGroupUrl,
  validateSignalGroupUrl,
  validateInstagramInviteUrl,
  validateFacebookGroupUrl,
  type ValidationResult,
} from "./validation";

/**
 * Everything currently wrong with the editor's data, derived from the store.
 *
 * The first cut of Strict Mode had each input register its own error into a
 * shared store as it rendered. That looked reasonable and was quietly useless:
 * the fields live on the Editor page, the gates live on Batch / Social /
 * Output / Profiles, and unmounting the Editor took every issue with it. Strict
 * Mode could never block anything on the page you were actually on.
 *
 * Deriving from state instead of from mounted components fixes that, and is
 * also simply more honest about what the setting promises. Two things follow:
 *
 *  - It works from any page, with no mount ordering or effect-loop hazards.
 *  - It catches invalid data that never passed through an input at all —
 *    an imported profile, a preset shared by someone else, a draft persisted
 *    before a validator got stricter. Since `ValidatedInput` refuses to commit
 *    invalid text, imports are in fact the main way bad data gets in.
 *
 * Pure and React-free, so the whole rule set is unit-testable.
 */

export type IssueSeverity = "error" | "warning";

export interface EditorIssue {
  /** Stable id — `storeLinks.steam`, `social.twitch`, `contactEmail`. */
  id: string;
  /** i18n key naming the field, for the banner. */
  labelKey: string;
  /** i18n key of the failure message. */
  messageKey: string;
  params?: Record<string, string | number>;
  /**
   * Only `"error"` blocks. `validateUrlWithPrefix` reports a *working* link
   * that merely doesn't match a platform's usual prefix as
   * `{ valid: true, error }` — a vanity domain or a regional mirror. Blocking
   * on that would strand the people most likely to have one.
   */
  severity: IssueSeverity;
}

/** Context that decides which optional fields are actually in play. */
export interface EditorIssueContext {
  /** When false, `adEmail` / `gameKeyEmail` are not rendered, so they cannot block. */
  splitContactEmail: boolean;
  /** Output language — Zalo is Vietnamese-only. */
  language: string;
}

/**
 * Is this field currently shown, and therefore allowed to block?
 *
 * Applied to *both* saved and typed issues. A value the user cannot see or
 * reach — `adEmail` after the split toggle goes off, `zaloGroupLink` after
 * switching away from Vietnamese — must never gate anything, or Strict Mode
 * becomes an unresolvable dead end.
 */
export function isRelevantIssueId(id: string, context: EditorIssueContext): boolean {
  if (id === "adEmail" || id === "gameKeyEmail") return context.splitContactEmail;
  if (id === "zaloGroupLink") return context.language === "vi";
  return true;
}

function toIssue(id: string, labelKey: string, result: ValidationResult): EditorIssue | null {
  if (result.valid && !result.error) return null;
  const issue: EditorIssue = {
    id,
    labelKey,
    messageKey: result.error ?? "validation.urlInvalid",
    severity: result.valid ? "warning" : "error",
  };
  if (result.errorParams) issue.params = result.errorParams;
  return issue;
}

export function collectEditorIssues(
  editor: EditorData,
  context: EditorIssueContext,
): EditorIssue[] {
  const { splitContactEmail } = context;
  const issues: EditorIssue[] = [];
  const add = (id: string, labelKey: string, result: ValidationResult) => {
    const issue = toIssue(id, labelKey, result);
    if (issue) issues.push(issue);
  };

  // Store links — one per platform, each with its own authoritative pattern.
  for (const platform of PLATFORMS) {
    const url = editor.storeLinks?.[platform.id];
    if (url)
      add(
        `storeLinks.${platform.id}`,
        platform.label,
        validateUrlWithPattern(url, platform.urlPattern),
      );
  }

  // Social + donate links. Same rule the editor uses: a declared prefix gets
  // the soft prefix check, everything else just has to be a URL.
  for (const field of SOCIAL_FIELDS) {
    const url = editor.social?.[field.id];
    if (!url) continue;
    add(
      `social.${field.id}`,
      field.labelKey,
      field.urlPrefix ? validateUrlWithPrefix(url, field.urlPrefix) : validateUrl(url),
    );
  }

  // Community invites. Zalo is Vietnamese-audience only — it neither renders
  // nor is editable in another output language, so it must not block there.
  if (editor.messengerCommunityLink)
    add(
      "messengerCommunityLink",
      "editor.messengerCommunityLink",
      validateMessengerUrl(editor.messengerCommunityLink),
    );
  if (editor.signalGroupLink)
    add(
      "signalGroupLink",
      "editor.signalGroupLink",
      validateSignalGroupUrl(editor.signalGroupLink),
    );
  if (editor.instagramGroupLink)
    add(
      "instagramGroupLink",
      "editor.instagramGroupLink",
      validateInstagramInviteUrl(editor.instagramGroupLink),
    );
  if (editor.facebookGroupLink)
    add(
      "facebookGroupLink",
      "editor.facebookGroupLink",
      validateFacebookGroupUrl(editor.facebookGroupLink),
    );
  if (isRelevantIssueId("zaloGroupLink", context) && editor.zaloGroupLink)
    add("zaloGroupLink", "editor.zaloGroupLink", validateZaloGroupUrl(editor.zaloGroupLink));

  // Contact emails. The two purpose-specific fields only exist — and only
  // render — while the split toggle is on.
  if (editor.contactEmail)
    add("contactEmail", "editor.contactEmail", validateEmails(editor.contactEmail));
  if (splitContactEmail) {
    if (editor.adEmail) add("adEmail", "editor.adEmail", validateEmails(editor.adEmail));
    if (editor.gameKeyEmail)
      add("gameKeyEmail", "editor.gameKeyEmail", validateEmails(editor.gameKeyEmail));
  }

  if (editor.playlistLink)
    add("playlistLink", "editor.playlistLink", validatePlaylistUrl(editor.playlistLink));

  if (editor.playtestLink) {
    const platform = PLAYTEST_PLATFORMS.find((p) => p.id === editor.playtestPlatform);
    add(
      "playtestLink",
      "editor.playtest.linkLabel",
      platform?.urlPattern
        ? validateUrlWithPattern(editor.playtestLink, platform.urlPattern)
        : validateUrl(editor.playtestLink),
    );
  }

  if (editor.liveUrl) add("liveUrl", "editor.liveUrl", validateUrl(editor.liveUrl));

  return issues;
}

/** Just the blocking subset — warnings are surfaced but never gate. */
export function collectEditorErrors(
  editor: EditorData,
  context: EditorIssueContext,
): EditorIssue[] {
  return collectEditorIssues(editor, context).filter((i) => i.severity === "error");
}
