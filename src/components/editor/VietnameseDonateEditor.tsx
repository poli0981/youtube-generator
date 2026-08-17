import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import { useEditorStore } from "@store/editor-store";
import { FIELD_LIMITS } from "@config/field-limits";
import {
  VIETNAMESE_BANKS,
  VIETNAMESE_BANK_OTHER,
  isCustomVietnameseBank,
} from "@config/vietnamese-banks";

/**
 * Vietnam-specific donate fields — bank transfer + e-wallets. The
 * `🏦 CHUYỂN KHOẢN / VÍ ĐIỆN TỬ` description block only renders when
 * the output language is Vietnamese, so the help text below the section
 * label flags that condition for creators who occasionally publish in
 * English / Japanese / etc.
 *
 * The fields are always visible in the editor regardless of the active
 * output language — we don't want creators to have to flip language
 * just to fill in their bank info, and the data is preserved in the
 * draft either way.
 *
 * v0.18.0: when the output language is Vietnamese, the bank-name field
 * upgrades to a dropdown sourced from
 * {@link VIETNAMESE_BANKS}. Picking "Khác" (Other) reveals an inline
 * text input so the field still accepts unlisted / digital-only / less
 * common banks. The persisted shape is unchanged — `vnBankName` is
 * still a `string` — so saved profiles and exports keep round-tripping.
 */
export function VietnameseDonateEditor() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();
  const language = useEditorStore((s) => s.language);
  const vnBankName = useEditorStore((s) => s.vnBankName);

  const isVi = language === "vi";

  // Sticky flag for the "user explicitly chose Other from the dropdown"
  // case. We can't derive it purely from `vnBankName` because the user
  // might pick "Other" with the field still empty — at that point the
  // value is `""`, which the auto-detector would treat as "use the
  // dropdown placeholder". The initial value still uses the auto-detect
  // (any non-preset saved name lights up custom mode on mount), so a
  // reload of e.g. "Citibank Vietnam" renders correctly without the
  // sticky flag needing to be hydrated.
  const [otherSticky, setOtherSticky] = useState(
    () => isVi && isCustomVietnameseBank(vnBankName ?? ""),
  );

  const customMode = isVi && (otherSticky || isCustomVietnameseBank(vnBankName ?? ""));
  const selectValue = customMode ? VIETNAMESE_BANK_OTHER : (vnBankName ?? "");

  const bankOptions = [
    { value: "", label: t("editor.vnBankNameSelectPlaceholder") },
    ...VIETNAMESE_BANKS.map((b) => ({ value: b, label: b })),
    { value: VIETNAMESE_BANK_OTHER, label: t("editor.vnBankNameOther") },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-text-secondary text-sm font-medium">{t("editor.vnDonate")}</span>
        <p className="text-text-muted text-xs">{t("editor.vnDonateHelp")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isVi ? (
          <div className="flex flex-col gap-2">
            <Select
              label={t("editor.vnBankName")}
              options={bankOptions}
              value={selectValue}
              onChange={(v) => {
                if (v === VIETNAMESE_BANK_OTHER) {
                  // Keep any value the creator already had — pre-existing
                  // free-form names should survive a Khác re-selection.
                  setOtherSticky(true);
                } else {
                  setOtherSticky(false);
                  store.set("vnBankName", v);
                }
              }}
            />
            {customMode && (
              <Input
                placeholder={t("editor.vnBankNamePlaceholder")}
                value={vnBankName ?? ""}
                onChange={(e) => store.set("vnBankName", e.target.value)}
              />
            )}
          </div>
        ) : (
          <Input
            label={t("editor.vnBankName")}
            maxLength={FIELD_LIMITS.SHORT_NAME}
            placeholder={t("editor.vnBankNamePlaceholder")}
            value={vnBankName ?? ""}
            onChange={(e) => store.set("vnBankName", e.target.value)}
          />
        )}
        <Input
          label={t("editor.vnBankAccount")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder={t("editor.vnBankAccountPlaceholder")}
          value={store.vnBankAccount ?? ""}
          onChange={(e) => store.set("vnBankAccount", e.target.value)}
        />
      </div>

      <Input
        label={t("editor.vnBankHolder")}
        maxLength={FIELD_LIMITS.SHORT_NAME}
        placeholder={t("editor.vnBankHolderPlaceholder")}
        value={store.vnBankHolder ?? ""}
        onChange={(e) => store.set("vnBankHolder", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("editor.vnMomo")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder={t("editor.vnMomoPlaceholder")}
          value={store.vnMomo ?? ""}
          onChange={(e) => store.set("vnMomo", e.target.value)}
        />
        <Input
          label={t("editor.vnZalopay")}
          maxLength={FIELD_LIMITS.SHORT_NAME}
          placeholder={t("editor.vnZalopayPlaceholder")}
          value={store.vnZalopay ?? ""}
          onChange={(e) => store.set("vnZalopay", e.target.value)}
        />
      </div>
    </div>
  );
}
