import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { CHANNEL_SLOT, channelOrSlot, withoutEmptyChannel } from "@engine/channel-phrase";
import type { SupportedLanguage } from "@engine/types";

const LANGS: SupportedLanguage[] = ["en", "vi", "ja", "es", "ko", "zh", "pt-BR", "id"];
const LOCALES = path.resolve(import.meta.dirname, "../../src/i18n/locales");

/** Every template that names the channel, except the copyright line (skipped without one). */
function channelTemplates(lang: SupportedLanguage): Array<[string, string]> {
  const data = JSON.parse(fs.readFileSync(path.join(LOCALES, lang, "templates.json"), "utf8"));
  const out: Array<[string, string]> = [];
  const walk = (node: unknown, prefix: string) => {
    if (typeof node === "string") {
      if (node.includes("{{channelName}}") && !prefix.includes("copyright"))
        out.push([prefix, node]);
      return;
    }
    if (node && typeof node === "object") {
      for (const [key, value] of Object.entries(node))
        walk(value, prefix ? `${prefix}.${key}` : key);
    }
  };
  walk(data, "");
  return out;
}

/** Stand-in for i18next: every other variable gets a plain value. */
function render(template: string, channel: string): string {
  return template
    .replace(/\{\{channelName\}\}/g, channel)
    .replace(/\{\{gameName\}\}/g, "Hades")
    .replace(/\{\{[a-zA-Z]+\}\}/g, "X");
}

describe("withoutEmptyChannel", () => {
  it("uses the slot only for an empty channel", () => {
    expect(channelOrSlot("  Skullmute ")).toBe("Skullmute");
    expect(channelOrSlot("  ")).toBe(CHANNEL_SLOT);
    expect(withoutEmptyChannel("of Hades on Skullmute.", "en")).toBe("of Hades on Skullmute.");
  });

  it.each(LANGS)("leaves no trace of a missing channel in any %s template", (lang) => {
    const templates = channelTemplates(lang);
    expect(templates.length).toBeGreaterThan(20);
    for (const [key, template] of templates) {
      const text = withoutEmptyChannel(render(template, CHANNEL_SLOT), lang);
      expect(text, key).not.toContain(CHANNEL_SLOT);
      expect(text, key).not.toMatch(/ {2}| [.,!?。！？]| on[.!]/);
    }
  });

  it("reads naturally in each language", () => {
    const intro = (lang: SupportedLanguage) => {
      const found = channelTemplates(lang).find(([key]) => key === "description.intro.full");
      return withoutEmptyChannel(render(found?.[1] ?? "", CHANNEL_SLOT), lang);
    };
    expect(intro("en")).toBe("This video features the full gameplay of Hades.");
    expect(intro("vi")).toBe("Video này là full gameplay của Hades.");
    expect(intro("ja")).toBe("この動画はHadesのフルゲームプレイです。");
    expect(intro("es")).toBe("Este video presenta el gameplay completo de Hades.");
    expect(intro("ko")).toBe("이 영상은 Hades의 전체 게임플레이를 담고 있습니다.");
    expect(intro("zh")).toBe("本视频展示了Hades完整游戏实况。");
    expect(intro("pt-BR")).toBe("Este vídeo traz a gameplay completa de Hades.");
    expect(intro("id")).toBe("Video ini menampilkan gameplay lengkap Hades.");
  });
});
