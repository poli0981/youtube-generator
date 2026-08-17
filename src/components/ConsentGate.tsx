import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Checkbox } from "@components/ui/Checkbox";
import { useDocumentTitle } from "@hooks/use-document-title";
import { useSettingsStore } from "@store/settings-store";
import { LEGAL_DOCS } from "@config/legal";

/**
 * First-run legal consent gate. Rendered full-screen and **non-dismissible**
 * (no ESC / backdrop / X — deliberately NOT the {@link import("@components/ui/Modal").Modal})
 * in place of the router until the user accepts the current terms version.
 *
 * Layout mirrors the v0.27.0 ErrorPage fullscreen pattern. Acceptance is
 * recorded in the settings store (`acceptLegalConsent`), which dual-writes to
 * localStorage + the Tauri settings file; the gate then yields to the app.
 * Re-shows automatically when CURRENT_TERMS_VERSION is bumped, and in fresh /
 * incognito storage.
 */
export function ConsentGate() {
  const { t } = useTranslation("ui");
  const [agreed, setAgreed] = useState(false);
  useDocumentTitle(t("consentGate.title"));

  const onContinue = (): void => {
    if (!agreed) return;
    useSettingsStore.getState().acceptLegalConsent();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="bg-surface-0 flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-12 text-center"
    >
      <ShieldCheck className="text-accent h-14 w-14" aria-hidden />

      <div className="max-w-md space-y-2">
        <h1 id="consent-title" className="text-text-primary text-2xl font-semibold">
          {t("consentGate.title")}
        </h1>
        <p className="text-text-secondary text-sm">{t("consentGate.intro")}</p>
      </div>

      <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
        {LEGAL_DOCS.map((doc) => (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-surface-1 text-text-primary hover:border-accent hover:bg-surface-2 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors"
          >
            <span className="flex-1 truncate text-left">{t(doc.labelKey)}</span>
            <ExternalLink className="text-text-muted h-3.5 w-3.5 shrink-0" />
          </a>
        ))}
      </div>

      <div className="border-border bg-surface-1 w-full max-w-md rounded-lg border p-4">
        <Checkbox checked={agreed} onChange={setAgreed} label={t("consentGate.agreeLabel")} />
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button variant="primary" onClick={onContinue} disabled={!agreed}>
          {t("consentGate.continue")}
        </Button>
        {!agreed && <p className="text-text-muted text-xs">{t("consentGate.mustAgree")}</p>}
      </div>
    </div>
  );
}
