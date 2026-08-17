import { useMemo } from "react";
import i18n from "i18next";
import { renderAll } from "@engine/template-renderer";
import { EMPTY_GENERATOR_OUTPUT, type GeneratorOutput } from "@engine/types";
import { useCurrentGeneratorInput } from "./use-current-generator-input";
import { useLanguagesReady } from "./use-languages-ready";
import { useRenderOptions } from "./use-render-options";

export function useGeneratedOutput(): GeneratorOutput {
  const input = useCurrentGeneratorInput();

  // Lazy-loaded locales (v0.26): block generation until the output
  // language's bundle is in memory — getFixedT would otherwise silently
  // render English, and OutputPage would save that as a history entry.
  const ready = useLanguagesReady([input.language]);

  const t = useMemo(() => i18n.getFixedT(input.language, "templates"), [input.language]);
  // Always-English `t` for the v0.11 bilingual content-warning block.
  // Built once per render so the engine receives a stable function ref;
  // the engine falls back to `t` when this is undefined. `en` is eagerly
  // bundled, so it never needs the readiness gate.
  const tEn = useMemo(() => i18n.getFixedT("en", "templates"), []);

  // Every settings-derived option in one place — see use-render-options.ts for
  // why this is a shared hook rather than a per-call-site destructure.
  const options = useRenderOptions(tEn);

  return useMemo(
    () => (!ready ? EMPTY_GENERATOR_OUTPUT : renderAll(input, t, options)),
    [ready, input, t, options],
  );
}
