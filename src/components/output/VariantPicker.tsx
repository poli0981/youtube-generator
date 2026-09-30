import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { CopyButton } from "./CopyButton";
import { CharCounter } from "./CharCounter";
import { buildTitleVariants, type TitleVariant } from "@engine/title-variants";
import { useLanguagesReady } from "@hooks/use-languages-ready";
import { useCurrentGeneratorInput } from "@hooks/use-current-generator-input";
import { useSettingsStore } from "@store/settings-store";
import { YT_LIMITS } from "@engine/types";

interface VariantPickerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Three title shapes for the current editor state, with the user's
 * separator and badge case. "Use this shape" saves the shape to the title
 * format, so every title — this one and the next — is built that way.
 */
export function VariantPicker({ open, onClose }: VariantPickerProps) {
  const { t } = useTranslation("ui");
  const input = useCurrentGeneratorInput();
  const showQualityBadge = useSettingsStore((s) => s.showQualityBadge);
  const titleFormat = useSettingsStore((s) => s.titleFormat);
  const setTitleFormat = useSettingsStore((s) => s.setTitleFormat);

  // Lazy-loaded locales (v0.26): only request the bundle while the modal
  // is actually open; the list fills in on the ready flip.
  const ready = useLanguagesReady(open ? [input.language] : []);

  const variants = useMemo(() => {
    if (!open || !ready) return [];
    const tFn = i18n.getFixedT(input.language, "templates");
    return buildTitleVariants(input, tFn, { ...titleFormat, showQualityBadge });
  }, [open, ready, input, titleFormat, showQualityBadge]);

  const isCurrent = (variant: TitleVariant) =>
    (titleFormat.order ?? "gameFirst") === variant.format.order &&
    titleFormat.badgePosition === variant.format.badgePosition;

  // Without a quality badge two shapes read the same; list each title once,
  // preferring the one in use.
  const shown = variants.filter((variant, index) => {
    if (isCurrent(variant)) return true;
    const current = variants.find(isCurrent);
    if (current && current.title === variant.title) return false;
    return variants.findIndex((other) => other.title === variant.title) === index;
  });

  const apply = (variant: TitleVariant) => {
    const before = {
      order: titleFormat.order ?? "gameFirst",
      badgePosition: titleFormat.badgePosition,
    };
    setTitleFormat(variant.format);
    toast.success(t("output.variantApplied", { name: t(variant.labelKey) }), {
      action: { label: t("common.undo"), onClick: () => setTitleFormat(before) },
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("output.generateAlternatives")}
      description={t("output.variantsHint")}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {shown.map((variant) => {
          const over = variant.title.length > YT_LIMITS.TITLE_MAX;
          const current = isCurrent(variant);
          return (
            <section key={variant.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-text-muted flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                  {t(variant.labelKey)}
                  {current && <Badge tone="accent">{t("output.variantCurrent")}</Badge>}
                </h3>
                <div className="flex items-center gap-2">
                  <CharCounter text={variant.title} limit={YT_LIMITS.TITLE_MAX} />
                  <CopyButton
                    text={variant.title}
                    label={t("output.copyTitle")}
                    blocked={over}
                    blockedHint={t("output.limits.fieldLine", {
                      field: t("output.title"),
                      count: variant.title.length,
                      limit: YT_LIMITS.TITLE_MAX,
                    })}
                  />
                  {!current && (
                    <Button variant="secondary" size="sm" onClick={() => apply(variant)}>
                      <Check />
                      {t("output.variantApply")}
                    </Button>
                  )}
                </div>
              </div>
              <p className="border-border bg-surface-0 text-text-primary rounded-lg border px-3 py-2.5 text-sm font-medium break-words">
                {variant.title}
              </p>
            </section>
          );
        })}
      </div>
    </Modal>
  );
}
