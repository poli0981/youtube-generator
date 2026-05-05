import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  Github,
  Bug,
  Youtube,
  Twitter,
  MessageCircle,
  Coffee,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { ABOUT, type AboutSocialId } from "@config/about";
import { THIRD_PARTY } from "@config/third-party";

interface SocialLinkConfig {
  id: AboutSocialId;
  url: string;
  icon: LucideIcon;
  labelKey: string;
}

export function AboutPage() {
  const { t } = useTranslation("ui");

  // Hidden when empty so a fresh clone with no socials filled in still
  // looks tidy on the About page.
  const allSocials: readonly SocialLinkConfig[] = [
    { id: "youtube", url: ABOUT.socials.youtube, icon: Youtube, labelKey: "about.socials.youtube" },
    { id: "x", url: ABOUT.socials.x, icon: Twitter, labelKey: "about.socials.x" },
    { id: "discord", url: ABOUT.socials.discord, icon: MessageCircle, labelKey: "about.socials.discord" },
    { id: "kofi", url: ABOUT.socials.kofi, icon: Coffee, labelKey: "about.socials.kofi" },
    { id: "patreon", url: ABOUT.socials.patreon, icon: Heart, labelKey: "about.socials.patreon" },
  ];
  const socials = allSocials.filter((s) => s.url.trim().length > 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-bold text-text-primary">
            {ABOUT.appName}
          </h1>
          <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-text-secondary">
            v{ABOUT.version}
          </span>
        </div>
        <p className="text-sm text-text-secondary">{t("about.tagline")}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("about.repoHeading")}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <ExternalLinkRow
            href={ABOUT.repo}
            icon={Github}
            label={t("about.repoLabel")}
          />
          <ExternalLinkRow
            href={ABOUT.issuesUrl}
            icon={Bug}
            label={t("about.issuesLabel")}
          />
          <ExternalLinkRow
            href={ABOUT.githubAuthor}
            icon={Github}
            label={t("about.authorLabel")}
          />
          <ExternalLinkRow
            href={ABOUT.licenseUrl}
            icon={ExternalLink}
            label={`${t("about.licenseLabel")} · ${ABOUT.license}`}
          />
        </div>
      </section>

      {socials.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
            {t("about.connectHeading")}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {socials.map((s) => (
              <ExternalLinkRow
                key={s.id}
                href={s.url}
                icon={s.icon}
                label={t(s.labelKey)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("about.thirdPartyHeading")}
        </h2>
        <p className="text-xs text-text-muted">{t("about.thirdPartyHelp")}</p>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {THIRD_PARTY.map((entry) => (
            <li key={entry.name} className="flex items-center justify-between rounded-lg border border-border bg-surface-1 px-3 py-2">
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-text-primary hover:text-accent"
              >
                <span className="font-medium">{entry.name}</span>
                <span className="font-mono text-xs text-text-muted">
                  {entry.version}
                </span>
              </a>
              <span className="text-xs text-text-muted">{entry.license}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

interface ExternalLinkRowProps {
  href: string;
  icon: LucideIcon;
  label: string;
}

function ExternalLinkRow({ href, icon: Icon, label }: ExternalLinkRowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3 py-2.5 text-sm text-text-primary transition-colors hover:border-accent hover:bg-surface-2"
    >
      <Icon className="h-4 w-4 shrink-0 text-text-secondary" />
      <span className="flex-1 truncate">{label}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-muted" />
    </a>
  );
}
