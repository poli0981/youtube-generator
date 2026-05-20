import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enUI from "./locales/en/ui.json";
import enTemplates from "./locales/en/templates.json";
import viUI from "./locales/vi/ui.json";
import viTemplates from "./locales/vi/templates.json";
import jaUI from "./locales/ja/ui.json";
import jaTemplates from "./locales/ja/templates.json";
import esUI from "./locales/es/ui.json";
import esTemplates from "./locales/es/templates.json";
import koUI from "./locales/ko/ui.json";
import koTemplates from "./locales/ko/templates.json";
import zhUI from "./locales/zh/ui.json";
import zhTemplates from "./locales/zh/templates.json";

export const SUPPORTED_LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧", nativeName: "English" },
  { id: "vi", label: "Vietnamese", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  { id: "ja", label: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { id: "es", label: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { id: "ko", label: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  { id: "zh", label: "Chinese", flag: "🇨🇳", nativeName: "简体中文" },
] as const;

i18n.use(initReactI18next).init({
  resources: {
    en: { ui: enUI, templates: enTemplates },
    vi: { ui: viUI, templates: viTemplates },
    ja: { ui: jaUI, templates: jaTemplates },
    es: { ui: esUI, templates: esTemplates },
    ko: { ui: koUI, templates: koTemplates },
    zh: { ui: zhUI, templates: zhTemplates },
  },
  ns: ["ui", "templates"],
  defaultNS: "ui",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
