import { describe, it, expect } from "vitest";
import { GATE_STRINGS, pickGateLang, type GateLang } from "../../worker/gate-i18n";
import { renderGatePage, escapeHtml } from "../../worker/gate-page";

describe("pickGateLang", () => {
  it.each([
    [null, "en"],
    ["", "en"],
    ["vi-VN,vi;q=0.9,en;q=0.8", "vi"],
    ["ja", "ja"],
    ["es-MX", "es"],
    ["ko-KR", "ko"],
    ["zh-TW,zh;q=0.8", "zh"],
    ["pt-PT", "pt-BR"],
    ["in", "id"],
    ["id-ID", "id"],
    ["fr-FR,fr;q=0.9", "en"],
    ["fr;q=1, vi;q=0.5", "vi"],
    ["en;q=0.2, ja;q=0.9", "ja"],
    ["vi;q=0, en", "en"],
  ] as const)("%s → %s", (header, lang) => {
    expect(pickGateLang(header)).toBe(lang);
  });
});

describe("gate strings", () => {
  const langs = Object.keys(GATE_STRINGS) as GateLang[];

  it("covers the app's eight languages", () => {
    expect(langs.sort()).toEqual(["en", "es", "id", "ja", "ko", "pt-BR", "vi", "zh"]);
  });

  it("fills every field and keeps every placeholder in every language", () => {
    for (const lang of langs) {
      const t = GATE_STRINGS[lang];
      for (const [key, value] of Object.entries(t)) {
        expect(value.trim(), `${lang}.${key}`).not.toBe("");
      }
      expect(t.agree, lang).toContain("{terms}");
      expect(t.agree, lang).toContain("{privacy}");
      expect(t.returning, lang).toContain("{terms}");
      expect(t.returning, lang).toContain("{privacy}");
      expect(t.dataNote, lang).toContain("{hours}");
    }
  });
});

describe("renderGatePage", () => {
  const base = {
    lang: "en" as const,
    nonce: "n0nce",
    siteKey: "0xSITE",
    returning: false,
    origin: "https://ytgenerator.stream",
    hours: 24,
  };

  it("links the Terms and Privacy Policy in the agreement line", () => {
    const html = renderGatePage(base);
    expect(html).toContain(
      '<a href="/legal/terms" target="_blank" rel="noopener">Terms of Use</a>',
    );
    expect(html).toContain('href="/legal/privacy"');
    expect(html).toContain('id="agree"');
    expect(html).toContain("for 24 hours");
  });

  it("puts the configuration in a JSON block that cannot close its <script>", () => {
    const html = renderGatePage({ ...base, siteKey: "</script><script>alert(1)</script>" });
    const block = /<script id="ytg-gate" type="application\/json">([^<]*)<\/script>/.exec(html);
    expect(block).not.toBeNull();
    expect(JSON.parse(block![1]!).siteKey).toBe("</script><script>alert(1)</script>");
  });

  it("nonces its only executable script", () => {
    const html = renderGatePage(base);
    const scripts = html.match(/<script(?![^>]*type="application\/json")[^>]*>/g) ?? [];
    expect(scripts).toEqual(['<script nonce="n0nce">']);
  });

  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
  });
});
