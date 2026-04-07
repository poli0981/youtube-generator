import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { useEditorStore } from "@store/editor-store";

export function LanguageSelector() {
  const { t } = useTranslation("ui");
  const language = useEditorStore((s) => s.language);
  const set = useEditorStore((s) => s.set);

  const options = SUPPORTED_LANGUAGES.map((lang) => ({
    value: lang.id,
    label: `${lang.flag} ${lang.nativeName}`,
  }));

  return (
    <Select
      label={t("editor.language")}
      options={options}
      value={language}
      onChange={(v) => set("language", v as typeof language)}
    />
  );
}
