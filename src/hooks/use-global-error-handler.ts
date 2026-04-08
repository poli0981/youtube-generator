import { useEffect } from "react";
import { logger } from "@utils/logger";

export function useGlobalErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logger.error(
        "runtime",
        event.message || "Unknown error",
        [
          event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : "",
          event.error?.stack ?? "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logger.error(
        "promise",
        reason instanceof Error ? reason.message : String(reason),
        reason instanceof Error ? reason.stack : undefined,
      );
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
}
