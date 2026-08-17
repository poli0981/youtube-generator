import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { useEditorStore } from "@store/editor-store";
import { validateUrl, validateUrlWithPattern, validateIntegerInRange } from "@utils/validation";
import { PLAYTEST_PLATFORMS, maxInvitesForPlatform } from "@config/playtest-platforms";
import { FIELD_LIMITS } from "@config/field-limits";

/**
 * Playtest section (v0.30.0). One signup link + the platform it lives on +
 * an optional invite count. Mirrors {@link StoreLinkEditor} but is a single
 * entry rather than one-per-platform. The invite-count input maxes out at
 * the selected platform's cap (≤100); switching to a lower-cap platform
 * clamps an over-budget count down. Renders into the description only when
 * a link is entered — no settings toggle gates it.
 */
export function PlaytestEditor() {
  const { t } = useTranslation("ui");
  const playtestLink = useEditorStore((s) => s.playtestLink);
  const playtestPlatform = useEditorStore((s) => s.playtestPlatform);
  const playtestInvites = useEditorStore((s) => s.playtestInvites);
  const setField = useEditorStore((s) => s.set);

  const platform =
    PLAYTEST_PLATFORMS.find((p) => p.id === playtestPlatform) ?? PLAYTEST_PLATFORMS[0];
  const cap = maxInvitesForPlatform(playtestPlatform);

  const platformOptions = PLAYTEST_PLATFORMS.map((p) => ({
    value: p.id,
    label: p.label,
  }));

  // The store holds the invite count as a number; the input edits raw text
  // so a mid-edit "2.5" / "-1" can show a warning without snapping back.
  // Invalid text is NOT committed, so the description stays clean.
  const [invitesText, setInvitesText] = useState(
    playtestInvites > 0 ? String(playtestInvites) : "",
  );

  // Resync the text when the store value changes from outside this input
  // (platform clamp, profile / preset load, draft reset). Only fires on a
  // real store change, so it never clobbers an in-progress invalid edit.
  useEffect(() => {
    const current = invitesText.trim() === "" ? 0 : Number(invitesText);
    if (current !== playtestInvites) {
      setInvitesText(playtestInvites > 0 ? String(playtestInvites) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playtestInvites]);

  const handlePlatformChange = (id: string) => {
    setField("playtestPlatform", id);
    const newCap = maxInvitesForPlatform(id);
    if (playtestInvites > newCap) {
      setField("playtestInvites", newCap);
    }
  };

  const handleInvitesChange = (raw: string) => {
    setInvitesText(raw);
    const result = validateIntegerInRange(raw, { min: 1, max: cap, allowEmpty: true });
    if (result.valid) {
      setField("playtestInvites", raw.trim() === "" ? 0 : Number(raw));
    }
  };

  const invitesValidation = validateIntegerInRange(invitesText, {
    min: 1,
    max: cap,
    allowEmpty: true,
  });
  const invitesError = invitesValidation.valid
    ? undefined
    : t(invitesValidation.error ?? "", invitesValidation.errorParams);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-text-secondary">
        {t("editor.playtest.heading")}
      </span>

      <ValidatedInput
        fieldId="editor.playtestLink"
        label={t("editor.playtest.linkLabel")}
        maxLength={FIELD_LIMITS.URL}
        placeholder={platform?.urlPrefix ?? "https://"}
        value={playtestLink}
        onChange={(v) => setField("playtestLink", v)}
        validate={(v) =>
          platform ? validateUrlWithPattern(v, platform.urlPattern) : validateUrl(v)
        }
        inputMode="url"
        autoComplete="off"
      />

      <div className="grid grid-cols-[1fr_9rem] items-start gap-2">
        <Select
          label={t("editor.playtest.platformLabel")}
          value={playtestPlatform}
          options={platformOptions}
          onChange={handlePlatformChange}
        />
        <Input
          label={t("editor.playtest.invitesLabel", { max: cap })}
          type="number"
          min={1}
          max={cap}
          step={1}
          inputMode="numeric"
          value={invitesText}
          onChange={(e) => handleInvitesChange(e.target.value)}
          errorText={invitesError}
          helpText={t("editor.playtest.invitesHelp", { max: cap })}
        />
      </div>
    </div>
  );
}
