import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "@store/settings-store";
import { useEditorIssues } from "@hooks/use-strict-block";

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
    <div
      role="alert"
      className="border-danger/40 bg-danger/10 text-danger flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs"
    >
      <span className="flex items-center gap-1.5 font-semibold">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
        {t("strict.blockedTitle", { count: errors.length })}
      </span>
      <ul className="flex flex-col gap-0.5 pl-5">
        {errors.map((issue) => (
          <li key={issue.id}>
            <span className="font-medium">{t(issue.labelKey)}</span>
            {" — "}
            {t(issue.messageKey, issue.params as Record<string, string>)}
          </li>
        ))}
      </ul>
      <span className="text-text-muted">{t("strict.fixHint")}</span>
    </div>
  );
}
