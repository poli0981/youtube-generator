import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Bug,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  HandHeart,
  Link2,
  Mail,
  MessagesSquare,
  Scale,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { ABOUT, type AboutContactId, type AboutSocialId } from "@config/about";
import { DONATE, type DonateId } from "@config/donate";
import { THIRD_PARTY } from "@config/third-party";
import { LEGAL_DOCS, legalDocPath } from "@config/legal";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Logo } from "@components/brand/Logo";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { Card, CardHeader } from "@components/ui/Card";
import { PageContainer } from "@components/ui/PageHeader";
import {
  BlueskyIcon,
  BuyMeACoffeeIcon,
  DiscordIcon,
  GithubIcon,
  KofiIcon,
  MastodonIcon,
  PatreonIcon,
  PaypalIcon,
  SteamIcon,
  TelegramIcon,
  XIcon,
  YoutubeIcon,
  type IconComponent,
} from "@components/icons/brand";

const SOCIAL_ICONS: Record<AboutSocialId, IconComponent> = {
  youtube: YoutubeIcon,
  x: XIcon,
  bluesky: BlueskyIcon,
  mastodon: MastodonIcon,
  discord: DiscordIcon,
  steam: SteamIcon,
  telegramBot: Send,
  telegramUser: TelegramIcon,
};

const DONATE_ICONS: Record<DonateId, IconComponent> = {
  githubSponsors: Sparkles,
  kofi: KofiIcon,
  buyMeACoffee: BuyMeACoffeeIcon,
  patreon: PatreonIcon,
  paypal: PaypalIcon,
};

/** The order contacts are listed in — the most common reasons first. */
const CONTACT_ORDER: readonly AboutContactId[] = [
  "general",
  "security",
  "privacy",
  "legal",
  "dmca",
  "copyright",
  "code",
  "sponsor",
];

const rowClass =
  "group text-text-primary hover:bg-surface-2 flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors";

function ExternalRow({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: IconComponent;
  label: string;
  hint?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={rowClass}>
      <Icon
        className="text-text-muted group-hover:text-accent size-4 shrink-0 transition-colors"
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {hint && <span className="text-text-muted hidden truncate text-xs sm:inline">{hint}</span>}
      <ExternalLink
        className="text-text-muted size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
    </a>
  );
}

function Section({
  title,
  icon,
  description,
  children,
}: {
  title: string;
  icon: ReactNode;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} icon={icon} description={description} />
      <div className="flex flex-col p-2 pt-2">{children}</div>
    </Card>
  );
}

export function AboutPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.about"));

  const socials = (Object.keys(ABOUT.socials) as AboutSocialId[]).filter(
    (id) => ABOUT.socials[id].trim().length > 0,
  );

  return (
    <PageContainer>
      {/* Hero — this page's heading. */}
      <Card className="relative overflow-hidden">
        <div
          className="bg-brand-gradient pointer-events-none absolute -top-24 -right-16 size-64 rounded-full opacity-20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <Logo className="size-14" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-text-primary text-2xl font-bold tracking-tight">
                {ABOUT.appName}
              </h1>
              <Badge tone="accent">v{ABOUT.version}</Badge>
              <Badge>{ABOUT.license}</Badge>
            </div>
            <p className="text-text-secondary mt-1 text-sm">{t("about.tagline")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={ABOUT.repo} target="_blank" rel="noopener noreferrer">
                <GithubIcon aria-hidden />
                GitHub
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <a href={ABOUT.bugReportUrl} target="_blank" rel="noopener noreferrer">
                <Bug aria-hidden="true" />
                {t("about.reportBugLabel")}
              </a>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title={t("about.repoHeading")} icon={<GithubIcon aria-hidden />}>
          <ExternalRow
            href={ABOUT.website}
            icon={Globe}
            label={t("about.websiteLabel")}
            hint="ytgenerator.stream"
          />
          <ExternalRow href={ABOUT.repo} icon={GithubIcon} label={t("about.repoLabel")} />
          <ExternalRow href={ABOUT.wikiUrl} icon={BookOpen} label={t("about.wikiLabel")} />
          <ExternalRow
            href={ABOUT.discussionsUrl}
            icon={MessagesSquare}
            label={t("about.discussionsLabel")}
          />
          <ExternalRow
            href={ABOUT.author.github}
            icon={Users}
            label={t("about.authorLabel")}
            hint={ABOUT.author.name}
          />
        </Section>

        <Section title={t("about.legalHeading")} icon={<Scale aria-hidden="true" />}>
          {LEGAL_DOCS.map((doc) => (
            <Link key={doc.id} to={legalDocPath(doc.id)} className={rowClass}>
              <FileText
                className="text-text-muted group-hover:text-accent size-4 shrink-0 transition-colors"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate">{t(doc.labelKey)}</span>
              <ChevronRight className="text-text-muted size-4 shrink-0" aria-hidden="true" />
            </Link>
          ))}
        </Section>

        <Section
          title={t("about.contactHeading")}
          icon={<Mail aria-hidden="true" />}
          description={t("about.contactHelp")}
        >
          {CONTACT_ORDER.map((id) => (
            <a key={id} href={`mailto:${ABOUT.contacts[id]}`} className={rowClass}>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{t(`about.contacts.${id}`)}</span>
                <span className="text-text-muted block truncate font-mono text-xs">
                  {ABOUT.contacts[id]}
                </span>
              </span>
              <Mail
                className="text-text-muted group-hover:text-accent size-4 shrink-0 transition-colors"
                aria-hidden="true"
              />
            </a>
          ))}
        </Section>

        <div className="flex flex-col gap-4">
          <Section
            title={t("about.donateHeading")}
            icon={<HandHeart aria-hidden="true" />}
            description={t("about.donateHelp")}
          >
            {(Object.keys(DONATE) as DonateId[]).map((id) => (
              <ExternalRow
                key={id}
                href={DONATE[id]}
                icon={DONATE_ICONS[id]}
                label={t(`about.donate.${id}`)}
              />
            ))}
          </Section>

          <Section title={t("about.connectHeading")} icon={<Link2 aria-hidden="true" />}>
            <ExternalRow
              href={ABOUT.author.website}
              icon={Globe}
              label={t("about.authorWebsite")}
              hint="poli0981.dev"
            />
            <ExternalRow href={ABOUT.author.links} icon={Link2} label={t("about.authorLinks")} />
            {socials.map((id) => (
              <ExternalRow
                key={id}
                href={ABOUT.socials[id]}
                icon={SOCIAL_ICONS[id]}
                label={t(`about.socials.${id}`)}
              />
            ))}
          </Section>
        </div>
      </div>

      <Card>
        <CardHeader
          title={t("about.thirdPartyHeading")}
          description={t("about.thirdPartyHelp")}
          icon={<Sparkles aria-hidden="true" />}
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to={legalDocPath("third-party")}>
                {t("legal.docs.thirdParty")}
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
        <ul className="grid gap-x-4 p-4 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {THIRD_PARTY.map((entry) => (
            <li
              key={entry.name}
              className="border-border flex items-center justify-between gap-3 border-b py-2 text-sm last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:[&:nth-last-child(-n+3)]:border-b-0"
            >
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-primary hover:text-accent min-w-0 truncate font-medium"
              >
                {entry.name}
                <span className="text-text-muted ml-1.5 font-mono text-xs font-normal">
                  {entry.version}
                </span>
              </a>
              <span className="text-text-muted shrink-0 text-xs">{entry.license}</span>
            </li>
          ))}
        </ul>
      </Card>
    </PageContainer>
  );
}
