import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { useEditorStore } from "@store/editor-store";

/**
 * Publisher/developer + platform pair for the "🎁 Thanks to …" credit
 * line. Rendered in the description only when the Settings toggle
 * `showSponsorCredit` is on AND both inputs are non-empty.
 */
export function SponsorCreditEditor() {
  const { t } = useTranslation("ui");
  const sponsorName = useEditorStore((s) => s.sponsorName);
  const sponsorPlatform = useEditorStore((s) => s.sponsorPlatform);
  const set = useEditorStore((s) => s.set);

  return (
    <div className="flex flex-col gap-2">
      <Input
        label={t("editor.sponsorName")}
        placeholder={t("editor.sponsorNamePlaceholder")}
        value={sponsorName ?? ""}
        onChange={(e) => set("sponsorName", e.target.value)}
      />
      <Input
        label={t("editor.sponsorPlatform")}
        placeholder={t("editor.sponsorPlatformPlaceholder")}
        value={sponsorPlatform ?? ""}
        onChange={(e) => set("sponsorPlatform", e.target.value)}
      />
    </div>
  );
}
