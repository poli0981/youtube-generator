import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { LimitedField, OutputLimitStatus } from "@engine/limits";

export interface CopyGate {
  blocked: boolean;
  blockedHint?: string;
}

/**
 * Per-field copy gating: a field can't be copied while it is over its
 * YouTube limit, or while Strict Mode is blocking — each with the reason as
 * the button's tooltip. Other fields stay copyable.
 */
export function useCopyGate(
  status: OutputLimitStatus,
  strictBlocked: boolean,
): (field: LimitedField) => CopyGate {
  const { t } = useTranslation("ui");
  return useCallback(
    (field: LimitedField): CopyGate => {
      if (strictBlocked) return { blocked: true, blockedHint: t("strict.copyBlocked") };
      const over = status.overflows.find((o) => o.field === field);
      if (!over) return { blocked: false };
      return {
        blocked: true,
        blockedHint: t("output.limits.fieldLine", {
          field: t(`output.${field}`),
          count: over.current,
          limit: over.limit,
        }),
      };
    },
    [status, strictBlocked, t],
  );
}
