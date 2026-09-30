import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, FileText, Languages } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Card } from "@components/ui/Card";
import { Checkbox } from "@components/ui/Checkbox";
import { IconButton } from "@components/ui/IconButton";
import { LanguageChip } from "@components/layout/LanguageChip";
import { Logo } from "@components/brand/Logo";
import { ThemeToggleIcon } from "@components/icons/animated";
import { useDocumentTitle } from "@hooks/use-document-title";
import { useSettingsStore } from "@store/settings-store";
import { LEGAL_DOCS, legalDocPath } from "@config/legal";

/** The documents a user agrees to on this screen. */
const CONSENT_DOCS = LEGAL_DOCS.filter((doc) => doc.consent);

/**
 * First-run legal consent gate. Rendered full-screen and **non-dismissible**
 * (no ESC / backdrop / X — deliberately NOT the {@link import("@components/ui/Modal").Modal})
 * in place of the router until the user accepts the current terms version.
 *
 * Acceptance is recorded in the settings store (`acceptLegalConsent`); the
 * gate then yields to the app. Re-shows automatically when
 * CURRENT_TERMS_VERSION is bumped, and in fresh / incognito storage. Each
 * document opens in the in-app Legal Center (a route outside the consent
 * guard), so reading one never leaves the app. Language and theme can be
 * changed right here — it is the first screen a new desktop user sees. On
 * the web, agreeing on the Cloudflare gate page counts too — see
 * `acceptConsentFromGate` in main.tsx.
 */
export function ConsentGate() {
  const { t } = useTranslation("ui");
  const [agreed, setAgreed] = useState(false);
  const appLanguage = useSettingsStore((s) => s.appLanguage);
  const setAppLanguage = useSettingsStore((s) => s.setAppLanguage);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  useDocumentTitle(t("consentGate.title"));

  const onContinue = (): void => {
    if (!agreed) return;
    useSettingsStore.getState().acceptLegalConsent();
  };

  return (
    <div className="bg-surface-0 relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div
        className="bg-brand-gradient pointer-events-none absolute top-0 left-1/2 h-64 w-[36rem] max-w-full -translate-x-1/2 rounded-full opacity-15 blur-3xl"
        aria-hidden="true"
      />

      <div className="absolute top-3 right-3 flex items-center gap-1">
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
      </div>

      <main className="relative w-full max-w-md">
        <Card className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex flex-col items-center gap-3 text-center">
            <Logo className="size-12" />
            <h1 className="text-text-primary text-xl font-semibold tracking-tight">
              {t("consentGate.title")}
            </h1>
            <p className="text-text-secondary text-sm leading-relaxed">{t("consentGate.intro")}</p>
          </div>

          <ul className="flex flex-col gap-1.5">
            {CONSENT_DOCS.map((doc) => (
              <li key={doc.id}>
                <Link
                  to={legalDocPath(doc.id)}
                  className="border-border bg-surface-0 text-text-primary hover:border-accent group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors"
                >
                  <FileText className="text-accent size-4 shrink-0" aria-hidden />
                  <span className="flex-1 truncate text-left">{t(doc.labelKey)}</span>
                  <ChevronRight
                    className="text-text-muted group-hover:text-accent size-4 shrink-0"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-border bg-surface-0 rounded-lg border p-3">
            <Checkbox checked={agreed} onChange={setAgreed} label={t("consentGate.agreeLabel")} />
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="brand" size="lg" onClick={onContinue} disabled={!agreed}>
              {t("consentGate.continue")}
            </Button>
            {!agreed && (
              <p className="text-text-muted text-center text-xs">{t("consentGate.mustAgree")}</p>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
