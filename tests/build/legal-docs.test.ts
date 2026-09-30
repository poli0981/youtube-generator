import { describe, it, expect } from "vitest";
import {
  extractEffectiveDate,
  renderAllLegalDocs,
  renderMarkdown,
  rewriteHref,
} from "../../build-plugins/legal-docs";
import { LEGAL_DOC_IDS } from "@config/legal";

describe("rewriteHref", () => {
  it.each([
    ["LICENSE", "TERMS.md", "/legal/license"],
    ["./DISCLAIMER.md", "TERMS.md", "/legal/disclaimer"],
    ["PRIVACY.md#cookies", "TERMS.md", "/legal/privacy#cookies"],
    ["../../../PRIVACY.md", "docs/i18n/vi/DISCLAIMER.md", "/legal/privacy"],
    [
      "CONTRIBUTING.md",
      "TERMS.md",
      "https://github.com/poli0981/youtube-generator/blob/main/CONTRIBUTING.md",
    ],
    [
      "./docs/I18N.md#adding",
      "README.md",
      "https://github.com/poli0981/youtube-generator/blob/main/docs/I18N.md#adding",
    ],
    ["https://example.com/x", "TERMS.md", "https://example.com/x"],
    ["mailto:legal@poli0981.dev", "TERMS.md", "mailto:legal@poli0981.dev"],
    ["#section", "TERMS.md", "#section"],
  ])("%s (from %s) → %s", (href, from, expected) => {
    expect(rewriteHref(href, from)).toBe(expected);
  });
});

describe("renderMarkdown", () => {
  it("reads the title and gives headings anchor ids", () => {
    const { title, html } = renderMarkdown(
      "# Privacy Policy\n\n## 3. Cookies\n\nText.",
      "PRIVACY.md",
    );
    expect(title).toBe("Privacy Policy");
    expect(html).toContain('<h2 id="3-cookies">3. Cookies</h2>');
  });

  it("opens external links in a new tab and keeps in-site links in place", () => {
    const { html } = renderMarkdown(
      "[site](https://example.com) and [privacy](PRIVACY.md)",
      "TERMS.md",
    );
    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">site</a>',
    );
    expect(html).toContain('<a href="/legal/privacy">privacy</a>');
  });
});

describe("extractEffectiveDate", () => {
  it("finds the effective date line", () => {
    expect(extractEffectiveDate("# X\n\n**Effective:** 2026-09-30\n")).toBe("2026-09-30");
    expect(extractEffectiveDate("# X\n\nno date")).toBeNull();
  });
});

describe("renderAllLegalDocs (the real repository files)", () => {
  const docs = renderAllLegalDocs();

  it("renders every document with a title and HTML", () => {
    for (const id of LEGAL_DOC_IDS) {
      expect(docs[id].title, id).not.toBe("");
      expect(docs[id].html.en?.length ?? 0, id).toBeGreaterThan(100);
    }
  });

  it("carries the Vietnamese Disclaimer", () => {
    expect(docs.disclaimer.html.vi).toBeTruthy();
  });

  it("dates the Terms and the Privacy Policy", () => {
    expect(docs.terms.effective).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(docs.privacy.effective).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("no longer sends readers to GitHub for another legal document", () => {
    for (const id of LEGAL_DOC_IDS) {
      const html = docs[id].html.en ?? "";
      expect(html, id).not.toMatch(
        /github\.com\/[^"]+\/blob\/main\/(TERMS|PRIVACY|DISCLAIMER|SECURITY|LICENSE)/,
      );
    }
  });

  it("uses the current contact addresses, not the retired one", () => {
    const all = LEGAL_DOC_IDS.map((id) => docs[id].html.en ?? "").join("\n");
    expect(all).not.toContain("lopop05905@proton.me");
    expect(docs.privacy.html.en).toContain("privacy@poli0981.dev");
    expect(docs.security.html.en).toContain("security@poli0981.dev");
  });
});
