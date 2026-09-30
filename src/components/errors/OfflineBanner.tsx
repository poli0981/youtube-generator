import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { WifiOff, X } from "lucide-react";
import { useOnlineStatus } from "@hooks/use-online-status";

/**
 * Non-blocking offline indicator.
 *
 * The app works fully offline (everything is client-side), so losing the
 * network must never block input — this is a dismissible pill at the top of
 * the screen (clear of the phone navigation bar), not a takeover page.
 * Dismiss only hides the *current* offline episode; the next online→offline
 * transition shows it again. A transient toast confirms when the connection
 * returns (reusing the app-level `<Toaster/>`).
 */
export function OfflineBanner() {
  const { t } = useTranslation("ui");
  const online = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const wasOnline = useRef(online);

  useEffect(() => {
    if (!wasOnline.current && online) {
      toast.success(t("errorPages.offlineBanner.backOnline"));
    }
    if (wasOnline.current && !online) {
      setDismissed(false);
    }
    wasOnline.current = online;
  }, [online, t]);

  if (online || dismissed) return null;

  return (
    <div
      role="status"
      className="border-warning/40 bg-surface-1 text-text-primary shadow-pop animate-slide-up fixed top-3 left-1/2 z-50 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-2.5 rounded-full border py-1.5 pr-1.5 pl-3.5 text-xs"
    >
      <WifiOff className="text-warning size-4 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{t("errorPages.offlineBanner.message")}</span>
      <Link to="/offline" className="text-accent hover:text-accent-hover shrink-0 font-medium">
        {t("errorPages.offlineBanner.details")}
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("common.dismiss")}
        className="text-text-muted hover:bg-surface-2 hover:text-text-primary flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
