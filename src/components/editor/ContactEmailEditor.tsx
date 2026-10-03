import { useTranslation } from "react-i18next";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import {
  validateEmails,
  validatePurposeEmails,
  canAcceptEmailInput,
  MAX_EMAILS,
  type ValidationResult,
} from "@utils/validation";
import { FIELD_LIMITS } from "@config/field-limits";
import { PURPOSE_EMAIL_KEYWORDS, type PurposeEmailField } from "@config/contact-emails";

// Module-level so each field's validator keeps its identity across renders
// (`ValidatedInput` lists `validate` among its callback dependencies).
const PURPOSE_VALIDATORS: Record<PurposeEmailField, (value: string) => ValidationResult> = {
  adEmail: (value) => validatePurposeEmails("adEmail", value),
  gameKeyEmail: (value) => validatePurposeEmails("gameKeyEmail", value),
  copyrightEmail: (value) => validatePurposeEmails("copyrightEmail", value),
};

/** The purpose words a field's help text lists — "dmca, takedown, …". */
function keywordsOf(field: PurposeEmailField): string {
  return PURPOSE_EMAIL_KEYWORDS[field].join(", ");
}

/**
 * Contact email input(s). Two modes, driven by the `splitContactEmail`
 * settings toggle:
 *
 *  - off (default) — a single "Contact Email" field, exactly as before.
 *    Feeds the description's single "📧 Business inquiries" line.
 *  - on — the general field plus three purpose fields (advertising / game
 *    keys & playtest / copyright, the last added in v1.1.0) that feed the
 *    grouped "📧 BUSINESS / CONTACT" block. The general field reuses the
 *    existing `contactEmail`, so a value entered before the toggle was
 *    flipped carries over as the Contact address.
 *
 * Every input allows up to 3 comma-separated addresses via
 * {@link validateEmails}, and a malformed value never reaches the
 * generated description ({@link ValidatedInput} keeps it out of the store).
 * The purpose fields also need a purpose word before `@`
 * ({@link validatePurposeEmails}), held to the same standard.
 */
export function ContactEmailEditor() {
  const { t } = useTranslation("ui");
  const contactEmail = useEditorStore((s) => s.contactEmail);
  const adEmail = useEditorStore((s) => s.adEmail);
  const gameKeyEmail = useEditorStore((s) => s.gameKeyEmail);
  const copyrightEmail = useEditorStore((s) => s.copyrightEmail);
  const setField = useEditorStore((s) => s.set);
  const splitContactEmail = useSettingsStore((s) => s.splitContactEmail);

  // Shared by every field. The cap is per field, not across the split: each
  // one renders its own labelled description line, so filling the
  // advertising address must not retroactively invalidate the contact one.
  // The purpose fields pass their own `validate` *after* this spread.
  const emailGuard = {
    validate: validateEmails,
    // Accept the change verbatim, or reject the keystroke with `null` so the
    // three addresses already typed survive untouched.
    beforeChange: (next: string, prev: string): string | null =>
      canAcceptEmailInput(next, prev) ? next : null,
    blockedMessage: t("validation.emailMaxReached", { max: MAX_EMAILS }),
    maxLength: FIELD_LIMITS.EMAIL_FIELD,
    inputMode: "email" as const,
    autoComplete: "email",
  };

  if (!splitContactEmail) {
    return (
      <ValidatedInput
        fieldId="contactEmail"
        labelKey="editor.contactEmail"
        label={t("editor.contactEmail")}
        placeholder={t("editor.contactEmailPlaceholder")}
        value={contactEmail ?? ""}
        onChange={(v) => setField("contactEmail", v)}
        helpText={t("editor.contactEmailHelp")}
        {...emailGuard}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ValidatedInput
        fieldId="contactEmail"
        labelKey="editor.contactEmail"
        label={t("editor.contactEmail")}
        placeholder={t("editor.contactEmailPlaceholder")}
        value={contactEmail ?? ""}
        onChange={(v) => setField("contactEmail", v)}
        helpText={t("editor.contactEmailHelp")}
        {...emailGuard}
      />
      <ValidatedInput
        fieldId="adEmail"
        labelKey="editor.adEmail"
        label={t("editor.adEmail")}
        placeholder={t("editor.adEmailPlaceholder")}
        value={adEmail ?? ""}
        onChange={(v) => setField("adEmail", v)}
        helpText={t("editor.adEmailHelp", { keywords: keywordsOf("adEmail") })}
        {...emailGuard}
        validate={PURPOSE_VALIDATORS.adEmail}
      />
      <ValidatedInput
        fieldId="gameKeyEmail"
        labelKey="editor.gameKeyEmail"
        label={t("editor.gameKeyEmail")}
        placeholder={t("editor.gameKeyEmailPlaceholder")}
        value={gameKeyEmail ?? ""}
        onChange={(v) => setField("gameKeyEmail", v)}
        helpText={t("editor.gameKeyEmailHelp", { keywords: keywordsOf("gameKeyEmail") })}
        {...emailGuard}
        validate={PURPOSE_VALIDATORS.gameKeyEmail}
      />
      <ValidatedInput
        fieldId="copyrightEmail"
        labelKey="editor.copyrightEmail"
        label={t("editor.copyrightEmail")}
        placeholder={t("editor.copyrightEmailPlaceholder")}
        value={copyrightEmail ?? ""}
        onChange={(v) => setField("copyrightEmail", v)}
        helpText={t("editor.copyrightEmailHelp", { keywords: keywordsOf("copyrightEmail") })}
        {...emailGuard}
        validate={PURPOSE_VALIDATORS.copyrightEmail}
      />
    </div>
  );
}
