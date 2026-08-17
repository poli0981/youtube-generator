import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Heart, Menu, Moon, Sun } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { useSettingsStore } from "@store/settings-store";
import { PRIMARY_DONATE_URL } from "@config/donate";
import type { SupportedLanguage } from "@engine/types";
import clsx from "clsx";

interface HeaderProps {
  onOpenMobileNav?: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const { t, i18n } = useTranslation("ui");
  const { appLanguage, setAppLanguage, theme, setTheme } = useSettingsStore();
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
    <header className="border-border bg-surface-1 flex items-center justify-between gap-2 border-b px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="text-text-secondary hover:bg-surface-2 hover:text-text-primary -ml-1 rounded-lg p-2 transition-colors md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-text-primary truncate text-base font-bold sm:text-lg">
            {t("app.title")}
          </h1>
          <p className="text-text-muted hidden truncate text-xs sm:block">{t("app.subtitle")}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={PRIMARY_DONATE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-pink-500/30 bg-pink-500/10 px-2.5 py-1.5 text-sm text-pink-300 transition-colors hover:border-pink-400/60 hover:bg-pink-500/20 hover:text-pink-200 sm:px-3"
          title={t("header.donate")}
          aria-label={t("header.donate")}
        >
          <Heart className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span className="hidden md:inline">{t("header.donate")}</span>
        </a>
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-text-secondary hover:bg-surface-2 hover:text-text-primary rounded-lg p-2 transition-colors"
          title={t("header.toggleTheme")}
          aria-label={t("header.toggleTheme")}
        >
          {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="hover:bg-surface-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors sm:px-3"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span>{current?.flag}</span>
            <span className="text-text-primary hidden sm:inline">{current?.nativeName}</span>
            <ChevronDown className="text-text-muted h-3.5 w-3.5" />
          </button>
          {open && (
            <div className="border-border bg-surface-1 absolute top-full right-0 z-50 mt-1 max-w-[calc(100vw-2rem)] min-w-[200px] rounded-lg border py-1 shadow-xl">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => handleSwitch(lang.id as SupportedLanguage)}
                  className={clsx(
                    "hover:bg-surface-2 flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors",
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
