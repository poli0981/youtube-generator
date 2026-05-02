import { useTranslation } from "react-i18next";
import { Select } from "@components/ui/Select";
import { Input } from "@components/ui/Input";
import { ChipGroup } from "@components/ui/ChipGroup";
import { Toggle } from "@components/ui/Toggle";
import { useEditorStore } from "@store/editor-store";
import {
  GRAPHICS_PRESETS,
  RT_MODES,
  FRAMEGEN_VENDORS,
  FRAMEGEN_MULTIPLIERS,
  UPSCALE_QUALITIES,
  ART_STYLES,
  type GraphicsPreset,
  type RTMode,
  type FrameGenVendor,
  type FrameGenMultiplier,
  type UpscaleQuality,
  type ArtStyle,
} from "@config/graphics-settings";

const RESOLUTION_OPTIONS = [
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
  { value: "1440p", label: "1440p" },
  { value: "4K", label: "4K" },
];

const FPS_OPTIONS = [
  { value: "30", label: "30 FPS" },
  { value: "60", label: "60 FPS" },
  { value: "120", label: "120 FPS" },
  { value: "144", label: "144 FPS" },
];

export function VideoSettingsForm() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

  const presetOptions = GRAPHICS_PRESETS.map((p) => ({
    value: p,
    label: t(`editor.graphicsPresetOptions.${p}`),
  }));

  const rtChipOptions = RT_MODES.map((m) => ({
    id: m,
    label: t(`editor.rtOptions.${m}`),
  }));

  const vendorOptions = FRAMEGEN_VENDORS.map((v) => ({
    value: v,
    label: t(`editor.frameGenVendorOptions.${v}`),
  }));

  const multiplierOptions = FRAMEGEN_MULTIPLIERS.map((m) => ({
    value: m,
    label: t(`editor.frameGenMultiplierOptions.${m}`),
  }));

  const upscaleOptions = UPSCALE_QUALITIES.map((q) => ({
    value: q,
    label: t(`editor.upscaleQualityOptions.${q}`),
  }));

  const artStyleOptions = ART_STYLES.map((s) => ({
    value: s,
    label: t(`editor.artStyleOptions.${s}`),
  }));

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium text-text-secondary">{t("editor.videoSettings")}</span>

      <div className="grid grid-cols-3 gap-3">
        <Select
          label={t("editor.resolution")}
          options={RESOLUTION_OPTIONS}
          value={store.resolution ?? "1080p"}
          onChange={(v) => store.set("resolution", v)}
        />
        <Select
          label={t("editor.fps")}
          options={FPS_OPTIONS}
          value={store.fps ?? "60"}
          onChange={(v) => store.set("fps", v)}
        />
        <Select
          label={t("editor.graphicsPreset")}
          options={presetOptions}
          value={store.graphicsPreset}
          onChange={(v) => store.set("graphicsPreset", v as GraphicsPreset)}
        />
      </div>

      {store.graphicsPreset === "custom" && (
        <Input
          label={t("editor.graphicsPresetCustom")}
          placeholder={t("editor.graphicsPresetCustomPlaceholder")}
          value={store.graphicsPresetCustom}
          onChange={(e) => store.set("graphicsPresetCustom", e.target.value)}
        />
      )}

      <Toggle
        label={t("editor.skipGraphicsSettings")}
        checked={store.skipGraphicsSettings}
        onChange={(v) => store.set("skipGraphicsSettings", v)}
      />
      <p className="-mt-1 text-xs text-text-muted">{t("editor.skipGraphicsSettingsHelp")}</p>

      {!store.skipGraphicsSettings && (
        <>
          <ChipGroup
            label={t("editor.rayTracing")}
            multiple
            options={rtChipOptions}
            value={store.rayTracingModes}
            onChange={(next) => store.set("rayTracingModes", next as RTMode[])}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t("editor.frameGenVendor")}
              options={vendorOptions}
              value={store.frameGenVendor}
              onChange={(v) => store.set("frameGenVendor", v as FrameGenVendor)}
            />
            <Select
              label={t("editor.frameGenMultiplier")}
              options={multiplierOptions}
              value={store.frameGenMultiplier}
              onChange={(v) => store.set("frameGenMultiplier", v as FrameGenMultiplier)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t("editor.upscaleQuality")}
              options={upscaleOptions}
              value={store.upscaleQuality}
              onChange={(v) => store.set("upscaleQuality", v as UpscaleQuality)}
            />
            <Select
              label={t("editor.artStyle")}
              options={artStyleOptions}
              value={store.artStyle}
              onChange={(v) => store.set("artStyle", v as ArtStyle)}
            />
          </div>

          <Input
            label={t("editor.versionInfo")}
            placeholder={t("editor.versionInfoPlaceholder")}
            value={store.versionInfo}
            onChange={(e) => store.set("versionInfo", e.target.value)}
          />
        </>
      )}
    </div>
  );
}
