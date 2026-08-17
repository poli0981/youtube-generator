import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import type { SupportedLanguage } from "@engine/types";
import { logger } from "@utils/logger";

import enUI from "./locales/en/ui.json";
import enTemplates from "./locales/en/templates.json";

export const SUPPORTED_LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧", nativeName: "English" },
  { id: "vi", label: "Vietnamese", flag: "🇻🇳", nativeName: "Tiếng Việt" },
  { id: "ja", label: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  { id: "es", label: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  { id: "ko", label: "Korean", flag: "🇰🇷", nativeName: "한국어" },
  { id: "zh", label: "Chinese", flag: "🇨🇳", nativeName: "简体中文" },
  { id: "pt-BR", label: "Portuguese (Brazil)", flag: "🇧🇷", nativeName: "Português (BR)" },
  { id: "id", label: "Indonesian", flag: "🇮🇩", nativeName: "Bahasa Indonesia" },
] as const satisfies readonly {
  id: SupportedLanguage;
  label: string;
  flag: string;
  nativeName: string;
}[];

i18n
  .use(initReactI18next)
  .use(
    // Vite statically analyses this template literal and emits one async
    // chunk per locale JSON, fetched on first use. `en` is also statically
    // imported above, so Rollup keeps it in the main chunk — and i18next
    // never asks the backend for it because bundled namespaces are served
    // from `resources` (see `partialBundledLanguages`).
    resourcesToBackend((lng: string, ns: string) => import(`./locales/${lng}/${ns}.json`)),
  )
  .init({
    resources: { en: { ui: enUI, templates: enTemplates } },
    partialBundledLanguages: true,
    ns: ["ui", "templates"],
    defaultNS: "ui",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    react: {
      // react-i18next defaults this to true; with lazily-loaded bundles an
      // unready namespace would suspend Header/AppShell, which sit outside
      // every Suspense boundary. Readiness is handled explicitly instead
      // (useLanguagesReady / ensureLanguagesLoaded).
      useSuspense: false,
    },
  });

const NAMESPACES = ["ui", "templates"] as const;

/** Both bundles for a language are in memory. */
export function hasLanguageBundles(lang: string): boolean {
  return NAMESPACES.every((ns) => i18n.hasResourceBundle(lang, ns));
}

/**
 * Resolve once every requested language has its `ui` + `templates` bundles
 * in memory — the contract every `getFixedT` call site relies on, since
 * i18next silently serves English fallback strings for unloaded languages.
 *
 * Never rejects: a language whose chunk cannot be fetched (offline, stale
 * deploy HTML) is logged and left to the `fallbackLng` English degrade.
 */
export async function ensureLanguagesLoaded(langs: readonly SupportedLanguage[]): Promise<void> {
  const wanted = [...new Set(langs)].filter((l) => !hasLanguageBundles(l));
  if (wanted.length === 0) return;
  await i18n.loadLanguages(wanted);
  // A failed fetch leaves the connector state at -1, and BOTH loadLanguages
  // and reloadResources skip state<0 entries forever after — one transient
  // blip would otherwise pin the whole session to English. Retry once by
  // importing the chunk directly and feeding the store (public API; the
  // template literal matches the backend loader's, so no extra chunks).
  const failed: SupportedLanguage[] = [];
  for (const lng of wanted.filter((l) => !hasLanguageBundles(l))) {
    for (const ns of NAMESPACES) {
      if (i18n.hasResourceBundle(lng, ns)) continue;
      try {
        const mod = (await import(`./locales/${lng}/${ns}.json`)) as {
          default: Record<string, unknown>;
        };
        i18n.addResourceBundle(lng, ns, mod.default);
      } catch {
        if (!failed.includes(lng)) failed.push(lng);
      }
    }
  }
  if (failed.length > 0) {
    logger.warn(
      "i18n",
      `Locale bundle load failed: ${failed.join(", ")} — falling back to English`,
    );
  }
}

export default i18n;
