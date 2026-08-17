import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { WifiOff, X } from "lucide-react";
import { useOnlineStatus } from "@hooks/use-online-status";

/**
 * Non-blocking offline indicator.
 *
 * The app works fully offline (everything is client-side), so losing the
 * network must never block input — this is a dismissible bottom strip, not a
 * takeover page. Dismiss only hides the *current* offline episode; the next
 * online→offline transition shows it again. A transient toast confirms when
 * the connection returns (reusing the app-level `<Toaster/>`).
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
      className="border-warning/40 bg-surface-2 text-text-primary fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 border-t px-4 py-2 text-sm shadow-md shadow-black/20"
    >
      <WifiOff className="text-warning h-4 w-4 shrink-0" aria-hidden />
      <span>{t("errorPages.offlineBanner.message")}</span>
      <Link to="/offline" className="text-accent hover:text-accent-hover font-medium">
        {t("errorPages.offlineBanner.details")}
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("common.dismiss")}
        className="text-text-muted hover:bg-surface-3 hover:text-text-primary ml-1 rounded p-1 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
