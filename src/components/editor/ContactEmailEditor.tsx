import { useTranslation } from "react-i18next";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { validateEmails } from "@utils/validation";

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

  if (!splitContactEmail) {
    return (
      <ValidatedInput
        label={t("editor.contactEmail")}
        placeholder={t("editor.contactEmailPlaceholder")}
        value={contactEmail ?? ""}
        onChange={(v) => setField("contactEmail", v)}
        validate={validateEmails}
        helpText={t("editor.contactEmailHelp")}
        inputMode="email"
        autoComplete="email"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ValidatedInput
        label={t("editor.contactEmail")}
        placeholder={t("editor.contactEmailPlaceholder")}
        value={contactEmail ?? ""}
        onChange={(v) => setField("contactEmail", v)}
        validate={validateEmails}
        helpText={t("editor.contactEmailHelp")}
        inputMode="email"
        autoComplete="email"
      />
      <ValidatedInput
        label={t("editor.adEmail")}
        placeholder={t("editor.adEmailPlaceholder")}
        value={adEmail ?? ""}
        onChange={(v) => setField("adEmail", v)}
        validate={validateEmails}
        helpText={t("editor.adEmailHelp")}
        inputMode="email"
        autoComplete="email"
      />
      <ValidatedInput
        label={t("editor.gameKeyEmail")}
        placeholder={t("editor.gameKeyEmailPlaceholder")}
        value={gameKeyEmail ?? ""}
        onChange={(v) => setField("gameKeyEmail", v)}
        validate={validateEmails}
        helpText={t("editor.gameKeyEmailHelp")}
        inputMode="email"
        autoComplete="email"
      />
    </div>
  );
}
