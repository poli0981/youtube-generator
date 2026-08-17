import { useTranslation } from "react-i18next";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { validateEmails, canAcceptEmailInput, MAX_EMAILS } from "@utils/validation";
import { FIELD_LIMITS } from "@config/field-limits";

/**
 * Contact email input(s). Two modes, driven by the `splitContactEmail`
 * settings toggle:
 *
 *  - off (default) — a single "Contact Email" field, exactly as before.
 *    Feeds the description's single "📧 Business inquiries" line.
 *  - on — three purpose fields (general / advertising / game keys &
 *    playtest) that feed the grouped "📧 BUSINESS / CONTACT" block. The
 *    general field reuses the existing `contactEmail`, so a value entered
 *    before the toggle was flipped carries over as the Contact address.
 *
 * Every input allows up to 3 comma-separated addresses via
 * {@link validateEmails}, and a malformed value never reaches the
 * generated description ({@link ValidatedInput} clears it on error).
 */
export function ContactEmailEditor() {
  const { t } = useTranslation("ui");
  const contactEmail = useEditorStore((s) => s.contactEmail);
  const adEmail = useEditorStore((s) => s.adEmail);
  const gameKeyEmail = useEditorStore((s) => s.gameKeyEmail);
  const setField = useEditorStore((s) => s.set);
  const splitContactEmail = useSettingsStore((s) => s.splitContactEmail);

  // Shared by all three fields. The cap is per field, not across the split:
  // each one renders its own labelled description line, so filling the
  // advertising address must not retroactively invalidate the contact one.
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
        fieldId="editor.contactEmail"
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
        fieldId="editor.contactEmail"
        label={t("editor.contactEmail")}
        placeholder={t("editor.contactEmailPlaceholder")}
        value={contactEmail ?? ""}
        onChange={(v) => setField("contactEmail", v)}
        helpText={t("editor.contactEmailHelp")}
        {...emailGuard}
      />
      <ValidatedInput
        fieldId="editor.adEmail"
        label={t("editor.adEmail")}
        placeholder={t("editor.adEmailPlaceholder")}
        value={adEmail ?? ""}
        onChange={(v) => setField("adEmail", v)}
        helpText={t("editor.adEmailHelp")}
        {...emailGuard}
      />
      <ValidatedInput
        fieldId="editor.gameKeyEmail"
        label={t("editor.gameKeyEmail")}
        placeholder={t("editor.gameKeyEmailPlaceholder")}
        value={gameKeyEmail ?? ""}
        onChange={(v) => setField("gameKeyEmail", v)}
        helpText={t("editor.gameKeyEmailHelp")}
        {...emailGuard}
      />
    </div>
  );
}
