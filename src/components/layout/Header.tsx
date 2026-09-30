import { useTranslation } from "react-i18next";
import { Heart, Languages, Search } from "lucide-react";
import clsx from "clsx";
import { useSettingsStore } from "@store/settings-store";
import { useEditorStore } from "@store/editor-store";
import { PRIMARY_DONATE_URL } from "@config/donate";
import { ABOUT } from "@config/about";
import { Logo } from "@components/brand/Logo";
import { ThemeToggleIcon } from "@components/icons/animated";
import { IconButton } from "@components/ui/IconButton";
import { ShortcutKeys } from "@components/ui/Badge";
import { Tooltip } from "@components/ui/Tooltip";
import { LanguageChip } from "./LanguageChip";

interface HeaderProps {
  onOpenCommandPalette: () => void;
}

/** Top bar: command palette, languages, theme, donate (and the brand on phones). */
export function Header({ onOpenCommandPalette }: HeaderProps) {
  const { t } = useTranslation("ui");
  const appLanguage = useSettingsStore((s) => s.appLanguage);
  const setAppLanguage = useSettingsStore((s) => s.setAppLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const outputLanguage = useEditorStore((s) => s.language);
  const setEditorField = useEditorStore((s) => s.set);

  return (
    <header className="border-border bg-surface-0/85 safe-top sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
        {/* Phones have no sidebar: show the brand here. Every page has its own
            <h1>, so the bar never repeats the page name. */}
        <div className="flex min-w-0 items-center gap-2 md:hidden">
          <Logo className="size-7" />
          <span className="text-text-primary truncate text-sm font-bold tracking-tight">
            {ABOUT.appName}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          aria-label={t("command.open")}
          className={clsx(
            "border-border bg-surface-1 text-text-muted hover:border-border-strong hover:text-text-secondary",
            "ml-auto inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-2 text-xs transition-colors sm:w-64 sm:px-2.5 md:mr-auto md:ml-0",
          )}
        >
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden flex-1 truncate text-left sm:inline">{t("command.open")}</span>
          {/* Wrappers carry the responsive display: the components' own
              inline-flex would otherwise beat a plain `hidden`. */}
          <span className="hidden sm:inline-flex">
            <ShortcutKeys keys={["mod", "K"]} />
          </span>
        </button>

        <div className="hidden sm:block">
          <LanguageChip
            label={t("header.outputLanguage")}
            value={outputLanguage}
            onChange={(language) => setEditorField("language", language)}
            prefix={<span className="text-text-muted font-medium">{t("tabs.output")}</span>}
          />
        </div>
        <LanguageChip
          label={t("header.interfaceLanguage")}
          value={appLanguage}
          onChange={setAppLanguage}
          prefix={<Languages className="size-3.5" aria-hidden="true" />}
        />

        <IconButton
          label={t(theme === "dark" ? "header.switchToLight" : "header.switchToDark")}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <ThemeToggleIcon theme={theme} />
        </IconButton>

        <Tooltip content={t("header.donate")}>
          <a
            href={PRIMARY_DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("header.donate")}
            className="text-donate hover:bg-donate/10 group size-control rounded-control hidden items-center justify-center transition-colors sm:inline-flex"
          >
            <Heart
              className="size-4 transition-transform duration-200 group-hover:scale-125 group-active:scale-90"
              aria-hidden="true"
            />
          </a>
        </Tooltip>
      </div>
    </header>
  );
}
