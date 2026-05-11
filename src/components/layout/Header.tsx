import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Heart } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { useSettingsStore } from "@store/settings-store";
import { PRIMARY_DONATE_URL } from "@config/donate";
import type { SupportedLanguage } from "@engine/types";
import clsx from "clsx";

export function Header() {
  const { t, i18n } = useTranslation("ui");
  const { appLanguage, setAppLanguage } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const current = SUPPORTED_LANGUAGES.find((l) => l.id === appLanguage);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSwitch = (langId: SupportedLanguage) => {
    setAppLanguage(langId);
    i18n.changeLanguage(langId);
    setOpen(false);
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface-1 px-6 py-3">
      <div>
        <h1 className="text-lg font-bold text-text-primary">{t("app.title")}</h1>
        <p className="text-xs text-text-muted">{t("app.subtitle")}</p>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={PRIMARY_DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-pink-500/30 bg-pink-500/10 px-3 py-1.5 text-sm text-pink-300 transition-colors hover:border-pink-400/60 hover:bg-pink-500/20 hover:text-pink-200"
          title={t("header.donate")}
        >
          <Heart className="h-3.5 w-3.5" />
          <span className="hidden md:inline">{t("header.donate")}</span>
        </a>
        <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-surface-2"
        >
          <span>{current?.flag}</span>
          <span className="text-text-primary">{current?.nativeName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
        </button>
        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-lg border border-border bg-surface-1 py-1 shadow-xl">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleSwitch(lang.id as SupportedLanguage)}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-surface-2",
                  lang.id === appLanguage ? "bg-accent-muted text-accent" : "text-text-primary",
                )}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
