import { readFileSync } from "fs";
import { posix, resolve } from "path";
import { Marked, type Tokens } from "marked";
import type { Plugin } from "vite";
import { LOGO_SVG, SITE_ORIGIN, copyrightYears } from "../src/config/brand.ts";
import { LEGAL_DOCS, legalDocPath, type LegalDoc, type LegalDocId } from "../src/config/legal.ts";

/**
 * Renders the repo-root legal documents at build time, twice:
 *
 *  1. `virtual:legal-docs` — { [id]: { title, effective, html: { en, vi? } } },
 *     imported lazily by the in-app Legal Center, so desktop and Android carry
 *     the documents offline and nothing is fetched from GitHub any more.
 *  2. `dist/legal/<id>.html` (+ `<id>.vi.html`, `index.html`) — plain pages
 *     with no script, which the Cloudflare Worker serves to anyone, before the
 *     Turnstile gate: people must be able to read the Terms and the Privacy
 *     Policy before they are asked to agree to them.
 *
 * `marked` runs only here, in Node — it adds nothing to the app bundle.
 */

const VIRTUAL_ID = "virtual:legal-docs";
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;
const REPO_BLOB = "https://github.com/poli0981/youtube-generator/blob/main/";
const ROOT = resolve(import.meta.dirname, "..");

type DocLang = "en" | "vi";

export interface RenderedLegalDoc {
  title: string;
  /** ISO date from an `**Effective:**` / `**Last updated:**` line, if any. */
  effective: string | null;
  html: Partial<Record<DocLang, string>>;
}

/** Repo-relative source file → document id, for cross-document links. */
const SOURCE_TO_ID: ReadonlyMap<string, LegalDocId> = new Map(
  LEGAL_DOCS.flatMap((doc): [string, LegalDocId][] =>
    doc.sourceVi
      ? [
          [doc.source, doc.id],
          [doc.sourceVi, doc.id],
        ]
      : [[doc.source, doc.id]],
  ),
);

/** Titles for the plain-text sources, which have no heading to read. */
const PLAIN_TEXT_TITLES: Partial<Record<LegalDocId, string>> = {
  license: "Apache License 2.0",
  notice: "NOTICE",
};

const HTML_ESCAPES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

/** Point relative links at the in-site page, or at GitHub for anything else. */
export function rewriteHref(href: string, fromFile: string): string {
  if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(href)) return href;
  const hashAt = href.indexOf("#");
  const pathPart = hashAt >= 0 ? href.slice(0, hashAt) : href;
  const hash = hashAt >= 0 ? href.slice(hashAt) : "";
  const resolved = posix.normalize(posix.join(posix.dirname(fromFile), pathPart));
  const id = SOURCE_TO_ID.get(resolved);
  return id ? `${legalDocPath(id)}${hash}` : `${REPO_BLOB}${resolved}${hash}`;
}

/**
 * Heading text → anchor id. Everything that is not a letter or digit becomes a
 * hyphen, which also rules out any markup ending up in an attribute.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/[`*_~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .trim();
}

export function renderMarkdown(source: string, fromFile: string): { title: string; html: string } {
  // Links are rewritten in the renderer rather than a `walkTokens` hook: that
  // hook only runs inside `marked.parse()`, and this renders via
  // `lexer()` + `parser()` so it can read the title from the tokens.
  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }) {
        const inner = this.parser.parseInline(tokens);
        return `<h${depth} id="${slugify(text)}">${inner}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        const target = rewriteHref(href, fromFile);
        const external = /^https?:/i.test(target);
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
        const rel = external ? ` target="_blank" rel="noopener noreferrer"` : "";
        return `<a href="${escapeHtml(target)}"${titleAttr}${rel}>${inner}</a>`;
      },
    },
  });
  const tokens = marked.lexer(source);
  const h1 = tokens.find((t): t is Tokens.Heading => t.type === "heading" && t.depth === 1);
  const html = marked.parser(tokens);
  return { title: h1 ? stripInlineMarkdown(h1.text) : "", html };
}

export function extractEffectiveDate(source: string): string | null {
  const match =
    /\*\*(?:Effective(?: date)?|Last updated|Ngày hiệu lực|Cập nhật lần cuối):?\*\*:?\s*(\d{4}-\d{2}-\d{2})/i.exec(
      source,
    );
  return match?.[1] ?? null;
}

function readSource(file: string): string {
  return readFileSync(resolve(ROOT, file), "utf8").replace(/\r\n/g, "\n");
}

function renderSource(doc: LegalDoc, file: string): { title: string; html: string } {
  const text = readSource(file);
  if (file.endsWith(".md")) return renderMarkdown(text, file);
  return {
    title: PLAIN_TEXT_TITLES[doc.id] ?? doc.id,
    html: `<pre class="plain">${escapeHtml(text.trim())}</pre>`,
  };
}

export function renderAllLegalDocs(): Record<LegalDocId, RenderedLegalDoc> {
  const out = {} as Record<LegalDocId, RenderedLegalDoc>;
  for (const doc of LEGAL_DOCS) {
    const en = renderSource(doc, doc.source);
    const rendered: RenderedLegalDoc = {
      title: en.title,
      effective: extractEffectiveDate(readSource(doc.source)),
      html: { en: en.html },
    };
    if (doc.sourceVi) rendered.html.vi = renderSource(doc, doc.sourceVi).html;
    out[doc.id] = rendered;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Static pages

const PAGE_CSS = `
:root{color-scheme:dark light;--bg:#0b0b12;--card:#12121a;--border:#262636;--text:#e7e7ef;--muted:#9a9ab0;--link:#a5a6fb;--code:#1b1b27;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif}
@media (prefers-color-scheme:light){:root{--bg:#f7f7fb;--card:#fff;--border:#e3e3ee;--text:#17171f;--muted:#5b5b70;--link:#4f46e5;--code:#f1f1f7}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);line-height:1.65}
a{color:var(--link)}
a:focus-visible{outline:2px solid var(--link);outline-offset:2px}
.top{position:sticky;top:0;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;background:color-mix(in srgb,var(--bg) 86%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.brand{display:flex;align-items:center;gap:10px;color:var(--text);text-decoration:none;font-weight:700;letter-spacing:-.01em}
.brand svg{width:28px;height:28px}
.open{font-size:14px;font-weight:600;text-decoration:none;padding:7px 14px;border-radius:10px;color:#fff;background:linear-gradient(135deg,#6366f1,#a855f7)}
.layout{display:grid;grid-template-columns:220px minmax(0,1fr);gap:32px;max-width:1080px;margin:0 auto;padding:32px 20px 64px}
nav p{margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
nav ul{list-style:none;margin:0;padding:0;position:sticky;top:76px}
nav a{display:block;padding:6px 10px;border-radius:8px;color:var(--muted);text-decoration:none;font-size:14px}
nav a:hover{color:var(--text);background:var(--card)}
nav a[aria-current=page]{color:var(--text);background:var(--card);font-weight:600}
article{min-width:0;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:28px 32px}
.meta{display:flex;flex-wrap:wrap;gap:8px 16px;margin:0 0 20px;font-size:13px;color:var(--muted)}
article h1{font-size:28px;line-height:1.25;margin:0 0 8px;letter-spacing:-.015em}
article h2{font-size:20px;margin:32px 0 10px;padding-top:8px;border-top:1px solid var(--border)}
article h3{font-size:16px;margin:24px 0 8px}
article p,article li{font-size:15px}
article table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;display:block;overflow-x:auto}
article th,article td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--border);vertical-align:top}
article code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em;background:var(--code);padding:.12em .38em;border-radius:6px}
article pre{background:var(--code);padding:16px;border-radius:12px;overflow-x:auto;font-size:13px;line-height:1.55}
article pre code{background:none;padding:0}
article pre.plain{white-space:pre-wrap;word-break:break-word}
article blockquote{margin:16px 0;padding:4px 16px;border-left:3px solid #6366f1;color:var(--muted)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-top:20px}
.cards a{display:block;padding:16px;border:1px solid var(--border);border-radius:12px;text-decoration:none;color:var(--text);background:var(--bg)}
.cards a:hover{border-color:#6366f1}
.cards span{display:block;font-size:13px;color:var(--muted);margin-top:4px;line-height:1.5}
footer{max-width:1080px;margin:0 auto;padding:0 20px 40px;font-size:13px;color:var(--muted)}
@media (max-width:760px){.layout{grid-template-columns:1fr;padding-top:20px}nav ul{position:static;display:flex;flex-wrap:wrap;gap:4px}article{padding:20px 18px}}
`;

/** One-line summaries for the static Legal index (English, like the pages). */
const DOC_SUMMARIES: Readonly<Record<LegalDocId, string>> = {
  terms: "What you may and may not do with YTDescGen and what it generates.",
  privacy: "What stays on your device, and what Cloudflare processes on the web.",
  disclaimer: "No warranty, AI-assisted development and translations, no affiliation.",
  license: "The Apache License 2.0 the source code is released under.",
  "third-party": "Open-source libraries, fonts and services YTDescGen relies on.",
  security: "How to report a vulnerability privately, and what is in scope.",
  notice: "The Apache-2.0 NOTICE file with copyright and attribution.",
  conduct: "Contributor Covenant rules for the project's community spaces.",
};

function pageShell(options: {
  title: string;
  canonicalPath: string;
  description: string;
  activeId: LegalDocId | null;
  body: string;
  lang: DocLang;
}): string {
  const nav = LEGAL_DOCS.map((doc) => {
    const current = doc.id === options.activeId ? ' aria-current="page"' : "";
    return `<li><a href="${legalDocPath(doc.id)}"${current}>${escapeHtml(TITLE_BY_ID[doc.id])}</a></li>`;
  }).join("");
  return `<!doctype html>
<html lang="${options.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0b0b12">
<title>${escapeHtml(options.title)} — YTDescGen</title>
<meta name="description" content="${escapeHtml(options.description)}">
<link rel="canonical" href="${SITE_ORIGIN}${options.canonicalPath}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>${PAGE_CSS}</style>
</head>
<body>
<header class="top"><a class="brand" href="/">${LOGO_SVG}<span>YTDescGen</span></a><a class="open" href="/">Open the app</a></header>
<div class="layout">
<nav aria-label="Legal documents"><p>Legal</p><ul>${nav}</ul></nav>
<main>${options.body}</main>
</div>
<footer>© ${copyrightYears(new Date().getUTCFullYear())} poli0981 (SkullMute) · Source code under the Apache License 2.0 · <a href="https://github.com/poli0981/youtube-generator">GitHub</a> · <a href="mailto:contact@poli0981.dev">contact@poli0981.dev</a></footer>
</body>
</html>
`;
}

const TITLE_BY_ID: Record<LegalDocId, string> = {
  terms: "Terms of Use",
  privacy: "Privacy Policy",
  disclaimer: "Disclaimer",
  license: "License (Apache-2.0)",
  "third-party": "Third-Party Notices",
  security: "Security Policy",
  notice: "NOTICE",
  conduct: "Code of Conduct",
};

function docPage(id: LegalDocId, doc: RenderedLegalDoc, lang: DocLang): string {
  const html = doc.html[lang] ?? doc.html.en ?? "";
  // The documents state their own effective date, so the meta line only
  // carries the language switch.
  const meta: string[] = [];
  if (doc.html.vi) {
    meta.push(
      lang === "en"
        ? `<a href="${legalDocPath(id)}?lang=vi" hreflang="vi" lang="vi">Tiếng Việt</a>`
        : `<a href="${legalDocPath(id)}" hreflang="en" lang="en">English</a>`,
    );
  }
  const metaLine = meta.length ? `<p class="meta">${meta.join(" · ")}</p>` : "";
  // Plain-text sources carry no <h1>; give them one.
  const heading = /^\s*<h1[\s>]/.test(html) ? "" : `<h1>${escapeHtml(TITLE_BY_ID[id])}</h1>`;
  return pageShell({
    title: TITLE_BY_ID[id],
    canonicalPath: legalDocPath(id),
    description: DOC_SUMMARIES[id],
    activeId: id,
    lang,
    body: `<article>${heading}${metaLine}${html}</article>`,
  });
}

function indexPage(): string {
  const cards = LEGAL_DOCS.map(
    (doc) =>
      `<a href="${legalDocPath(doc.id)}"><strong>${escapeHtml(TITLE_BY_ID[doc.id])}</strong><span>${escapeHtml(DOC_SUMMARIES[doc.id])}</span></a>`,
  ).join("");
  return pageShell({
    title: "Legal",
    canonicalPath: "/legal",
    description: "Terms, privacy, licensing and security information for YTDescGen.",
    activeId: null,
    lang: "en",
    body: `<article><h1>Legal</h1><p>Terms, privacy, licensing and security information for YTDescGen — the same documents the app shows in its Legal Center.</p><div class="cards">${cards}</div></article>`,
  });
}

export function legalDocsPlugin(options: { emitStaticPages: boolean }): Plugin {
  return {
    name: "ytdescgen:legal-docs",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return null;
      for (const doc of LEGAL_DOCS) {
        this.addWatchFile(resolve(ROOT, doc.source));
        if (doc.sourceVi) this.addWatchFile(resolve(ROOT, doc.sourceVi));
      }
      return `export const LEGAL_CONTENT = ${JSON.stringify(renderAllLegalDocs())};\n`;
    },
    generateBundle() {
      if (!options.emitStaticPages) return;
      const docs = renderAllLegalDocs();
      this.emitFile({ type: "asset", fileName: "legal/index.html", source: indexPage() });
      for (const doc of LEGAL_DOCS) {
        const rendered = docs[doc.id];
        this.emitFile({
          type: "asset",
          fileName: `legal/${doc.id}.html`,
          source: docPage(doc.id, rendered, "en"),
        });
        if (rendered.html.vi) {
          this.emitFile({
            type: "asset",
            fileName: `legal/${doc.id}.vi.html`,
            source: docPage(doc.id, rendered, "vi"),
          });
        }
      }
    },
  };
}
