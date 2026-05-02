import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { useEditorStore } from "@store/editor-store";

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
 */
export function VietnameseDonateEditor() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-secondary">
          {t("editor.vnDonate")}
        </span>
        <p className="text-xs text-text-muted">{t("editor.vnDonateHelp")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("editor.vnBankName")}
          placeholder={t("editor.vnBankNamePlaceholder")}
          value={store.vnBankName ?? ""}
          onChange={(e) => store.set("vnBankName", e.target.value)}
        />
        <Input
          label={t("editor.vnBankAccount")}
          placeholder={t("editor.vnBankAccountPlaceholder")}
          value={store.vnBankAccount ?? ""}
          onChange={(e) => store.set("vnBankAccount", e.target.value)}
        />
      </div>

      <Input
        label={t("editor.vnBankHolder")}
        placeholder={t("editor.vnBankHolderPlaceholder")}
        value={store.vnBankHolder ?? ""}
        onChange={(e) => store.set("vnBankHolder", e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={t("editor.vnMomo")}
          placeholder={t("editor.vnMomoPlaceholder")}
          value={store.vnMomo ?? ""}
          onChange={(e) => store.set("vnMomo", e.target.value)}
        />
        <Input
          label={t("editor.vnZalopay")}
          placeholder={t("editor.vnZalopayPlaceholder")}
          value={store.vnZalopay ?? ""}
          onChange={(e) => store.set("vnZalopay", e.target.value)}
        />
      </div>
    </div>
  );
}
