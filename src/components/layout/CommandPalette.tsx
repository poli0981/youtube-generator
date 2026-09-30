import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Command } from "cmdk";
import {
  BookOpen,
  Bug,
  ClipboardCopy,
  Contrast,
  FileText,
  Gamepad2,
  Keyboard,
  Languages,
  LayoutTemplate,
  Scale,
  Search,
  Tags,
  Type,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { NAV_ITEMS } from "@config/navigation";
import { ABOUT } from "@config/about";
import { SUPPORTED_LANGUAGES } from "@i18n/index";
import { useSettingsStore } from "@store/settings-store";
import { useEditorStore } from "@store/editor-store";
import { useProfileStore } from "@store/profile-store";
import { usePresetStore } from "@store/preset-store";
import { useTemplateStore } from "@store/template-store";
import { useOutputCopy } from "@hooks/use-output-copy";
import { applyPreset, applyProfile, applyTemplate } from "@utils/library-apply";
import { openExternal } from "@utils/open-external";
import type { SupportedLanguage } from "@engine/types";
import { Kbd, ShortcutKeys } from "@components/ui/Badge";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShowShortcuts: () => void;
}

function Item({
  children,
  onSelect,
  keywords,
  icon,
  hint,
}: {
  children: ReactNode;
  onSelect: () => void;
  keywords?: string[];
  icon?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      keywords={keywords}
      className="text-text-primary data-[selected=true]:bg-surface-2 flex h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm select-none [&_svg]:size-4 [&_svg]:shrink-0"
    >
      <span className="text-text-muted flex">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint && <span className="text-text-muted text-xs">{hint}</span>}
    </Command.Item>
  );
}

const groupClass =
  "[&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:uppercase";

/** Everything below only mounts while the palette is open. */
function PaletteBody({
  close,
  onShowShortcuts,
}: {
  close: () => void;
  onShowShortcuts: () => void;
}) {
  const { t } = useTranslation("ui");
  const navigate = useNavigate();
  const copyOutput = useOutputCopy();
  const profiles = useProfileStore((s) => s.profiles);
  const presets = usePresetStore((s) => s.presets);
  const templates = useTemplateStore((s) => s.templates);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setAppLanguage = useSettingsStore((s) => s.setAppLanguage);
  const setEditorField = useEditorStore((s) => s.set);

  const run = (fn: () => void) => () => {
    close();
    fn();
  };

  return (
    <>
      <div className="border-border flex items-center gap-2 border-b px-3">
        <Search className="text-text-muted size-4 shrink-0" aria-hidden="true" />
        <Command.Input
          autoFocus
          placeholder={t("command.placeholder")}
          className="text-text-primary placeholder:text-text-muted h-12 w-full bg-transparent text-sm outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>
      <Command.List className="max-h-[min(60dvh,26rem)] scrollbar-thin overflow-y-auto p-1.5">
        <Command.Empty className="text-text-muted py-10 text-center text-sm">
          {t("command.empty")}
        </Command.Empty>

        <Command.Group heading={t("command.groups.navigate")} className={groupClass}>
          {NAV_ITEMS.map((item) => (
            <Item key={item.to} icon={<item.icon />} onSelect={run(() => navigate(item.to))}>
              {t(item.labelKey)}
            </Item>
          ))}
          <Item icon={<Scale />} onSelect={run(() => navigate("/legal"))}>
            {t("legal.title")}
          </Item>
        </Command.Group>

        <Command.Group heading={t("command.groups.copy")} className={groupClass}>
          <Item icon={<Type />} onSelect={run(() => void copyOutput("title"))}>
            {t("output.copyTitle")}
          </Item>
          <Item icon={<FileText />} onSelect={run(() => void copyOutput("description"))}>
            {t("output.copyDescription")}
          </Item>
          <Item icon={<Tags />} onSelect={run(() => void copyOutput("tags"))}>
            {t("output.copyTags")}
          </Item>
          <Item
            icon={<ClipboardCopy />}
            hint={<ShortcutKeys keys={["mod", "shift", "C"]} />}
            onSelect={run(() => void copyOutput("all"))}
          >
            {t("output.copyAll")}
          </Item>
        </Command.Group>

        {profiles.length > 0 && (
          <Command.Group heading={t("command.groups.profiles")} className={groupClass}>
            {profiles.map((profile) => (
              <Item
                key={profile.id}
                icon={<UserRound />}
                keywords={[profile.channelName]}
                onSelect={run(() => applyProfile(profile))}
              >
                {profile.name}
              </Item>
            ))}
          </Command.Group>
        )}

        {presets.length > 0 && (
          <Command.Group heading={t("command.groups.presets")} className={groupClass}>
            {presets.map((preset) => (
              <Item key={preset.id} icon={<Gamepad2 />} onSelect={run(() => applyPreset(preset))}>
                {preset.gameName}
              </Item>
            ))}
          </Command.Group>
        )}

        {templates.length > 0 && (
          <Command.Group heading={t("command.groups.templates")} className={groupClass}>
            {templates.map((template) => (
              <Item
                key={template.id}
                icon={<LayoutTemplate />}
                onSelect={run(() => void applyTemplate(template))}
              >
                {template.name}
              </Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading={t("command.groups.preferences")} className={groupClass}>
          <Item
            icon={<Contrast />}
            onSelect={run(() => setTheme(theme === "dark" ? "light" : "dark"))}
          >
            {t(theme === "dark" ? "header.switchToLight" : "header.switchToDark")}
          </Item>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Item
              key={`ui-${lang.id}`}
              icon={<Languages />}
              keywords={[lang.label, lang.id]}
              hint={lang.id.toUpperCase()}
              onSelect={run(() => setAppLanguage(lang.id as SupportedLanguage))}
            >
              {t("command.interfaceIn", { language: lang.nativeName })}
            </Item>
          ))}
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Item
              key={`out-${lang.id}`}
              icon={<FileText />}
              keywords={[lang.label, lang.id]}
              hint={lang.id.toUpperCase()}
              onSelect={run(() => setEditorField("language", lang.id as SupportedLanguage))}
            >
              {t("command.outputIn", { language: lang.nativeName })}
            </Item>
          ))}
        </Command.Group>

        <Command.Group heading={t("command.groups.help")} className={groupClass}>
          <Item icon={<Keyboard />} onSelect={run(onShowShortcuts)}>
            {t("shortcuts.title")}
          </Item>
          <Item icon={<BookOpen />} onSelect={run(() => void openExternal(ABOUT.wikiUrl))}>
            {t("command.wiki")}
          </Item>
          <Item icon={<Bug />} onSelect={run(() => void openExternal(ABOUT.bugReportUrl))}>
            {t("tabs.reportBug")}
          </Item>
        </Command.Group>
      </Command.List>
    </>
  );
}

/**
 * Ctrl/⌘+K: jump to any page, copy output, apply a saved profile / preset /
 * template, switch theme or language — without leaving the keyboard.
 */
export function CommandPalette({ open, onOpenChange, onShowShortcuts }: CommandPaletteProps) {
  const { t } = useTranslation("ui");
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label={t("command.title")}
      loop
      overlayClassName="bg-overlay animate-fade-in fixed inset-0 z-50 backdrop-blur-[2px]"
      contentClassName="bg-surface-1 border-border shadow-pop animate-pop-in fixed top-[12dvh] left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-panel border focus:outline-none"
    >
      {open && <PaletteBody close={() => onOpenChange(false)} onShowShortcuts={onShowShortcuts} />}
    </Command.Dialog>
  );
}
