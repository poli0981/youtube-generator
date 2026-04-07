import enTemplates from "../../src/i18n/locales/en/templates.json";
import viTemplates from "../../src/i18n/locales/vi/templates.json";
import jaTemplates from "../../src/i18n/locales/ja/templates.json";
import type { TranslationFn } from "../../src/engine/types";

type NestedRecord = Record<string, unknown>;

const templatesByLang: Record<string, NestedRecord> = {
  en: enTemplates,
  vi: viTemplates,
  ja: jaTemplates,
};

function getNestedValue(obj: NestedRecord, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as NestedRecord)[key];
  }
  return current;
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function createMockT(lang = "en"): TranslationFn {
  const templates = templatesByLang[lang] ?? templatesByLang["en"]!;

  return (key: string, options?: Record<string, string>): string => {
    const value = getNestedValue(templates, key);
    if (typeof value !== "string") {
      return key;
    }
    return options ? interpolate(value, options) : value;
  };
}
