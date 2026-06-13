import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  Github,
  Bug,
  Youtube,
  Twitter,
  MessageCircle,
  MessageSquare,
  Cloud,
  Gamepad2,
  Send,
  Mail,
  Coffee,
  Heart,
  Sparkles,
  DollarSign,
  type LucideIcon,
} from "lucide-react";
import { ABOUT, type AboutSocialId } from "@config/about";
import { DONATE, type DonateId } from "@config/donate";
import { THIRD_PARTY } from "@config/third-party";
import { LEGAL_DOCS } from "@config/legal";
import { useDocumentTitle } from "@hooks/use-document-title";

interface SocialLinkConfig {
  id: AboutSocialId;
  url: string;
  icon: LucideIcon;
  labelKey: string;
}

interface DonateLinkConfig {
  id: DonateId;
  url: string;
  icon: LucideIcon;
  labelKey: string;
}

export function AboutPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.about"));

  // Hidden when empty so a fresh clone with no socials filled in still
  // looks tidy on the About page. Ko-fi / Patreon were moved to the
  // Donate section in v0.13.1 — keep them out of this list.
  const allSocials: readonly SocialLinkConfig[] = [
    { id: "youtube", url: ABOUT.socials.youtube, icon: Youtube, labelKey: "about.socials.youtube" },
    { id: "x", url: ABOUT.socials.x, icon: Twitter, labelKey: "about.socials.x" },
    { id: "bluesky", url: ABOUT.socials.bluesky, icon: Cloud, labelKey: "about.socials.bluesky" },
    { id: "mastodon", url: ABOUT.socials.mastodon, icon: MessageSquare, labelKey: "about.socials.mastodon" },
    { id: "discord", url: ABOUT.socials.discord, icon: MessageCircle, labelKey: "about.socials.discord" },
    { id: "discordGame", url: ABOUT.socials.discordGame, icon: Gamepad2, labelKey: "about.socials.discordGame" },
    { id: "steam", url: ABOUT.socials.steam, icon: Gamepad2, labelKey: "about.socials.steam" },
    { id: "telegramBot", url: ABOUT.socials.telegramBot, icon: Send, labelKey: "about.socials.telegramBot" },
    { id: "telegramUser", url: ABOUT.socials.telegramUser, icon: Send, labelKey: "about.socials.telegramUser" },
    { id: "email", url: ABOUT.socials.email, icon: Mail, labelKey: "about.socials.email" },
  ];
  const socials = allSocials.filter((s) => s.url.trim().length > 0);

  const donateLinks: readonly DonateLinkConfig[] = [
    { id: "githubSponsors", url: DONATE.githubSponsors, icon: Sparkles, labelKey: "about.donate.githubSponsors" },
    { id: "kofi", url: DONATE.kofi, icon: Coffee, labelKey: "about.donate.kofi" },
    { id: "buyMeACoffee", url: DONATE.buyMeACoffee, icon: Coffee, labelKey: "about.donate.buyMeACoffee" },
    { id: "patreon", url: DONATE.patreon, icon: Heart, labelKey: "about.donate.patreon" },
    { id: "paypal", url: DONATE.paypal, icon: DollarSign, labelKey: "about.donate.paypal" },
  ];

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
            href={ABOUT.bugReportUrl}
            icon={Bug}
            label={t("about.reportBugLabel")}
          />
          <ExternalLinkRow
            href={ABOUT.discussionsUrl}
            icon={MessageSquare}
            label={t("about.discussionsLabel")}
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

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("about.legalHeading")}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEGAL_DOCS.map((doc) => (
            <ExternalLinkRow
              key={doc.id}
              href={doc.url}
              icon={ExternalLink}
              label={t(doc.labelKey)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          {t("about.donateHeading")}
        </h2>
        <p className="text-xs text-text-muted">{t("about.donateHelp")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {donateLinks.map((d) => (
            <ExternalLinkRow
              key={d.id}
              href={d.url}
              icon={d.icon}
              label={t(d.labelKey)}
              accent
            />
          ))}
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
  accent?: boolean;
}

function ExternalLinkRow({ href, icon: Icon, label, accent }: ExternalLinkRowProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        accent
          ? "flex items-center gap-3 rounded-lg border border-pink-500/30 bg-pink-500/5 px-3 py-2.5 text-sm text-text-primary transition-colors hover:border-pink-400/60 hover:bg-pink-500/10"
          : "flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-3 py-2.5 text-sm text-text-primary transition-colors hover:border-accent hover:bg-surface-2"
      }
    >
      <Icon className={accent ? "h-4 w-4 shrink-0 text-pink-300" : "h-4 w-4 shrink-0 text-text-secondary"} />
      <span className="flex-1 truncate">{label}</span>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-text-muted" />
    </a>
  );
}
