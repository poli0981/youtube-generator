import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Modal } from "@components/ui/Modal";
import { CopyButton } from "./CopyButton";
import { CharCounter } from "./CharCounter";
import { buildTitleVariants } from "@engine/title-variants";
import { useLanguagesReady } from "@hooks/use-languages-ready";
import { useEditorStore } from "@store/editor-store";
import { useSettingsStore } from "@store/settings-store";
import { YT_LIMITS, type GeneratorInput } from "@engine/types";

interface VariantPickerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal that shows 3 A/B-testable title variants for the current editor
 * state. Generated fresh each time the modal opens — no state persists
 * here because the titles are derived from the store.
 */
export function VariantPicker({ open, onClose }: VariantPickerProps) {
  const { t } = useTranslation("ui");
  const state = useEditorStore();
  const showQualityBadge = useSettingsStore((s) => s.showQualityBadge);

  // Lazy-loaded locales (v0.26): only request the bundle while the modal
  // is actually open; the list fills in on the ready flip.
  const ready = useLanguagesReady(open ? [state.language] : []);

  const variants = useMemo(() => {
    if (!open || !ready) return [];
    const input: GeneratorInput = {
      videoType: state.videoType,
      language: state.language,
      genres: state.genres,
      gameName: state.gameName,
      gameNameLocalized: state.gameNameLocalized,
      channelName: state.channelName,
      platform: state.platform,
      partNumber: state.partNumber,
      bossName: state.bossName,
      dlcName: state.dlcName,
      challengeName: state.challengeName,
      modName: state.modName,
      resolution: state.resolution,
      fps: state.fps,
      graphicsPreset: state.graphicsPreset,
      spoilerWarning: state.spoilerWarning,
      matureWarning: state.matureWarning,
      storeLinks: state.storeLinks,
      social: state.social,
      rig: state.rig,
    };
    const tFn = i18n.getFixedT(state.language, "templates");
    return buildTitleVariants(input, tFn, showQualityBadge);
  }, [
    open,
    ready,
    showQualityBadge,
    state.videoType,
    state.language,
    state.genres,
    state.gameName,
    state.gameNameLocalized,
    state.channelName,
    state.platform,
    state.partNumber,
    state.bossName,
    state.dlcName,
    state.challengeName,
    state.modName,
    state.resolution,
    state.fps,
    state.graphicsPreset,
    state.spoilerWarning,
    state.matureWarning,
    state.storeLinks,
    state.social,
    state.rig,
  ]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("output.generateAlternatives")}
      className="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {variants.map((variant) => (
          <section key={variant.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {t(variant.labelKey)}
              </h3>
              <div className="flex items-center gap-3">
                <CharCounter text={variant.title} limit={YT_LIMITS.TITLE_MAX} />
                <CopyButton text={variant.title} label={t("output.copyTitle")} />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-3">
              <p className="text-sm font-medium text-text-primary">{variant.title}</p>
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}
