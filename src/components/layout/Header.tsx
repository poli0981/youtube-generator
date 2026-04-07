import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { SUPPORTED_LANGUAGES } from "@i18n/index";

export function Header() {
  const { t, i18n } = useTranslation("ui");

  const langOptions = SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang.id,
    label: `${lang.flag} ${lang.nativeName}`,
  }));

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-1 px-6 py-3">
      <div>
        <h1 className="text-lg font-bold text-text-primary">{t("app.title")}</h1>
        <p className="text-xs text-text-muted">{t("app.subtitle")}</p>
      </div>
      <div className="w-40">
        <Select
          options={langOptions}
          value={i18n.language}
          onChange={(v) => i18n.changeLanguage(v)}
        />
      </div>
    </header>
  );
}
