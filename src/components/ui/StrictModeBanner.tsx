import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@store/settings-store";
import { useEditorIssues } from "@hooks/use-strict-block";
import { Banner } from "./Banner";

/**
 * Lists the fields Strict Mode is blocking on.
 *
 * A disabled Generate button with no explanation is worse than no gate at all,
 * so this always names the offending field and its error. Renders nothing when
 * Strict Mode is off or nothing is wrong.
 */
export function StrictModeBanner() {
  const { t } = useTranslation("ui");
  const strictMode = useSettingsStore((s) => s.strictMode);
  const issues = useEditorIssues();
  const errors = issues.filter((i) => i.severity === "error");

  if (!strictMode || errors.length === 0) return null;

  return (
    <Banner tone="danger" alert title={t("strict.blockedTitle", { count: errors.length })}>
      <ul className="flex list-disc flex-col gap-0.5 pl-4">
        {errors.map((issue) => (
          <li key={issue.id}>
            <span className="text-text-primary font-medium">{t(issue.labelKey)}</span>
            {" — "}
            {t(issue.messageKey, issue.params as Record<string, string>)}
          </li>
        ))}
      </ul>
      <p className="text-text-muted mt-1">{t("strict.fixHint")}</p>
    </Banner>
  );
}
