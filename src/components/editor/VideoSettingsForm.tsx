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
  ART_STYLES,
  type GraphicsPreset,
  type RTMode,
  type FrameGenVendor,
  type FrameGenMultiplier,
  type UpscaleQuality,
  type ArtStyle,
} from "@config/graphics-settings";
import {
  getValidUpscaleQualities,
  getValidFrameGenMultipliers,
  coerceUpscaleQuality,
  coerceFrameGenMultiplier,
} from "@engine/graphics-vendor";
import { VIDEO_STYLE_ERA_IDS, type VideoStyleEra } from "@config/video-styles";

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

  // v0.22.0 — video-style era opt-in. Renders independently of
  // `skipGraphicsSettings`, so we wire it above the toggle: 2D / pixel-art
  // creators still edit their footage and may want the style credit even
  // when the in-game graphics block is suppressed.
  const videoStyleOptions = [
    { value: "", label: t("editor.videoStyleOff") },
    ...VIDEO_STYLE_ERA_IDS.map((id) => ({
      value: id,
      label: t(`editor.videoStyleOptions.${id}`),
    })),
  ];

  // v0.11: vendor-filtered option lists. NVIDIA exposes DLAA + 4 quality
  // tiers, AMD exposes FSR Native AA + 4, Intel exposes XeSS Native AA +
  // Ultra Quality + 4. None falls back to the vendor-agnostic ladder so
  // pre-v0.11 drafts keep their settings on rehydrate. Labels live in
  // vendor-keyed `editor.upscaleQuality.{vendor}.{id}` /
  // `editor.frameGenMultiplier.{vendor}.{id}` namespaces; vendor=none
  // uses the legacy flat `Options` keys.
  const multiplierOptions = getValidFrameGenMultipliers(store.frameGenVendor).map((m) => ({
    value: m,
    label:
      store.frameGenVendor === "none"
        ? t(`editor.frameGenMultiplierOptions.${m}`)
        : t(`editor.frameGenMultiplier.${store.frameGenVendor}.${m}`),
  }));

  const upscaleOptions = getValidUpscaleQualities(store.frameGenVendor).map((q) => ({
    value: q,
    label:
      store.frameGenVendor === "none"
        ? t(`editor.upscaleQualityOptions.${q}`)
        : t(`editor.upscaleQuality.${store.frameGenVendor}.${q}`),
  }));

  // When the vendor changes, the previously-selected upscale quality /
  // frame-gen multiplier may no longer be in the new dropdown's options
  // (e.g. switching DLSS→FSR drops `dlaa`). Coerce to "none" so the
  // Select doesn't render with a stale, no-longer-rendered value.
  function handleVendorChange(next: FrameGenVendor) {
    store.set("frameGenVendor", next);
    const coercedQ = coerceUpscaleQuality(next, store.upscaleQuality);
    if (coercedQ !== store.upscaleQuality) store.set("upscaleQuality", coercedQ);
    const coercedM = coerceFrameGenMultiplier(next, store.frameGenMultiplier);
    if (coercedM !== store.frameGenMultiplier) store.set("frameGenMultiplier", coercedM);
  }

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

      <Select
        label={t("editor.videoStyle")}
        options={videoStyleOptions}
        value={store.videoStyleEra}
        onChange={(v) => store.set("videoStyleEra", v as VideoStyleEra)}
      />
      <p className="-mt-1 text-xs text-text-muted">{t("editor.videoStyleHelp")}</p>

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
              onChange={(v) => handleVendorChange(v as FrameGenVendor)}
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
