import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enUI from "./locales/en/ui.json";
import enTemplates from "./locales/en/templates.json";
import viUI from "./locales/vi/ui.json";
import viTemplates from "./locales/vi/templates.json";
import jaUI from "./locales/ja/ui.json";
import jaTemplates from "./locales/ja/templates.json";

export const SUPPORTED_LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧", nativeName: "English" },
  { id: "vi", label: "Vietnamese", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  { id: "ja", label: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
] as const;

export type SupportedLanguageId = (typeof SUPPORTED_LANGUAGES)[number]["id"];

i18n.use(initReactI18next).init({
  resources: {
    en: { ui: enUI, templates: enTemplates },
    vi: { ui: viUI, templates: viTemplates },
    ja: { ui: jaUI, templates: jaTemplates },
  },
  ns: ["ui", "templates"],
  defaultNS: "ui",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
