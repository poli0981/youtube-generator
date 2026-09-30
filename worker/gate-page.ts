import { LOGO_SVG } from "../src/config/brand";
import { legalDocPath } from "../src/config/legal";
import { STATUS_PATH, TURNSTILE_ACTION, VERIFY_PATH } from "./env";
import { GATE_STRINGS, type GateLang } from "./gate-i18n";

/**
 * The Turnstile gate page. Served at whatever URL the visitor asked for, so a
 * successful check just reloads the same URL — there is no `next` parameter to
 * validate and nothing to open-redirect.
 */

export interface GatePageOptions {
  lang: GateLang;
  nonce: string;
  siteKey: string;
  /** The visitor already accepted the current terms (the `ytg_terms` cookie). */
  returning: boolean;
  /** e.g. `https://ytgenerator.stream` — for canonical / OpenGraph URLs. */
  origin: string;
  /** Gate lifetime in hours, quoted in the data note. */
  hours: number;
}

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

/** JSON that is safe inside a <script> element. */
function scriptJson(value: unknown): string {
  // Only "<" matters: it is what could close the <script> element early. It is
  // replaced by its six-character JSON escape (backslash, "u003c").
  const escapedLt = "\\" + "u003c";
  return JSON.stringify(value).replace(/</g, escapedLt);
}

function link(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

/** Fill `{terms}` / `{privacy}` with links; everything else is escaped text. */
function withLinks(template: string, links: Readonly<Record<string, string>>): string {
  return template
    .split(/(\{[a-z]+\})/)
    .map((piece) => {
      const key = /^\{([a-z]+)\}$/.exec(piece)?.[1];
      return key && links[key] !== undefined ? links[key] : escapeHtml(piece);
    })
    .join("");
}

const STYLES = `
:root{color-scheme:dark light;--bg:#0b0b12;--card:#13131c;--border:#262636;--text:#ececf3;--muted:#9a9ab0;--link:#a5a6fb;--danger:#f87171;font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif}
@media (prefers-color-scheme:light){:root{--bg:#f6f6fb;--card:#fff;--border:#e3e3ee;--text:#16161f;--muted:#5d5d72;--link:#4f46e5;--danger:#dc2626}}
*{box-sizing:border-box}
html,body{min-height:100%}
body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px 16px;color:var(--text);background:radial-gradient(1100px 560px at 88% -12%,rgba(124,58,237,.24),transparent 60%),radial-gradient(900px 520px at -12% 112%,rgba(79,70,229,.18),transparent 60%),var(--bg)}
main{width:100%;max-width:420px;background:var(--card);border:1px solid var(--border);border-radius:20px;padding:28px 24px;box-shadow:0 24px 64px -28px rgba(0,0,0,.55)}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:15px;letter-spacing:-.01em;margin:0 0 20px}
.brand svg{width:32px;height:32px}
h1{font-size:20px;line-height:1.3;margin:0 0 6px;letter-spacing:-.01em}
.lead{margin:0 0 18px;color:var(--muted);font-size:14px;line-height:1.55}
#ts{min-height:65px;margin:0 0 14px}
.agree{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.5;margin:0 0 16px;cursor:pointer}
.agree input{margin:2px 0 0;width:16px;height:16px;flex:none;accent-color:#6366f1}
.fine{font-size:13px;line-height:1.5;color:var(--muted);margin:0 0 16px}
a{color:var(--link)}
button{width:100%;height:42px;border:0;border-radius:12px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font:inherit;font-weight:600;font-size:14.5px;cursor:pointer;transition:filter .15s,opacity .15s}
button:disabled{opacity:.45;cursor:not-allowed}
button:not(:disabled):hover{filter:brightness(1.08)}
a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--link);outline-offset:2px}
.status{min-height:20px;margin:12px 0 0;font-size:13px;line-height:1.45;color:var(--muted);text-align:center}
.status.err{color:var(--danger)}
.note{margin:16px 0 0;padding-top:14px;border-top:1px solid var(--border);font-size:12px;line-height:1.55;color:var(--muted)}
footer{font-size:12px;color:var(--muted);text-align:center;line-height:1.8}
footer a{color:inherit}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`;

/** Client script — tiny, dependency-free, CSP-nonced. */
const CLIENT_SCRIPT = `
(function(){
  var cfg = JSON.parse(document.getElementById("ytg-gate").textContent);
  var enter = document.getElementById("enter");
  var agree = document.getElementById("agree");
  var status = document.getElementById("status");
  // Submit on its own the first time; after a failure wait for a click, so a
  // widget that re-issues tokens can never loop against a refusing server.
  var token = null, widgetId = null, busy = false, auto = true;
  function say(msg, isError){ status.textContent = msg || ""; status.className = isError ? "status err" : "status"; }
  function ready(){ return !!token && !busy && (!agree || agree.checked); }
  function sync(){ enter.disabled = !ready(); }
  function fail(msg){
    busy = false; token = null; auto = false; say(msg, true); sync();
    if (window.turnstile && widgetId !== null) { try { window.turnstile.reset(widgetId); } catch (e) {} }
  }
  function submit(){
    if (!ready()) return;
    busy = true; sync(); say(cfg.s.checking);
    fetch(cfg.verify, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token, consent: true }) })
      .then(function(res){ if (!res.ok) throw new Error("verify"); return fetch(cfg.status, { credentials: "same-origin", cache: "no-store" }); })
      .then(function(res){ if (res.status !== 204) throw new Error("cookie"); say(cfg.s.entering); window.location.reload(); })
      .catch(function(err){ fail(err && err.message === "cookie" ? cfg.s.cookies : cfg.s.failed); });
  }
  enter.addEventListener("click", submit);
  if (agree) agree.addEventListener("change", function(){ sync(); if (agree.checked && auto) submit(); });
  window.ytgTurnstileReady = function(){
    widgetId = window.turnstile.render("#ts", {
      sitekey: cfg.siteKey, action: cfg.action, theme: "auto", language: "auto", size: "flexible",
      callback: function(t){ token = t; sync(); if (auto && (!agree || agree.checked)) submit(); },
      "expired-callback": function(){ token = null; sync(); },
      "error-callback": function(){ token = null; say(cfg.s.widgetError, true); sync(); return true; }
    });
  };
  var s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=ytgTurnstileReady";
  s.async = true; s.defer = true;
  s.onerror = function(){ say(cfg.s.widgetError, true); };
  document.head.appendChild(s);
})();
`;

const COOKIES_BLOCKED: Readonly<Record<GateLang, string>> = {
  en: "Your browser blocked the cookie that remembers this check. Allow cookies for ytgenerator.stream and try again.",
  vi: "Trình duyệt đã chặn cookie ghi nhớ bước kiểm tra. Hãy cho phép cookie cho ytgenerator.stream rồi thử lại.",
  ja: "確認を記憶する Cookie がブラウザにブロックされました。ytgenerator.stream の Cookie を許可してから再試行してください。",
  es: "Tu navegador bloqueó la cookie que recuerda esta comprobación. Permite las cookies de ytgenerator.stream e inténtalo de nuevo.",
  ko: "브라우저가 확인 결과를 기억하는 쿠키를 차단했습니다. ytgenerator.stream의 쿠키를 허용한 뒤 다시 시도해 주세요.",
  zh: "浏览器拦截了用于记住验证结果的 Cookie。请允许 ytgenerator.stream 的 Cookie 后重试。",
  "pt-BR":
    "Seu navegador bloqueou o cookie que lembra esta verificação. Permita cookies para ytgenerator.stream e tente de novo.",
  id: "Browser Anda memblokir cookie yang mengingat pemeriksaan ini. Izinkan cookie untuk ytgenerator.stream lalu coba lagi.",
};

export function renderGatePage(options: GatePageOptions): string {
  const t = GATE_STRINGS[options.lang];
  const links = {
    terms: link(legalDocPath("terms"), t.termsLink),
    privacy: link(legalDocPath("privacy"), t.privacyLink),
  };
  const consentBlock = options.returning
    ? `<p class="fine">${withLinks(t.returning, links)}</p>`
    : `<label class="agree"><input type="checkbox" id="agree"><span>${withLinks(t.agree, links)}</span></label>`;
  const config = {
    siteKey: options.siteKey,
    action: TURNSTILE_ACTION,
    verify: VERIFY_PATH,
    status: STATUS_PATH,
    s: {
      checking: t.checking,
      entering: t.entering,
      failed: t.failed,
      widgetError: t.widgetError,
      cookies: COOKIES_BLOCKED[options.lang],
    },
  };
  const origin = escapeHtml(options.origin);
  const dataNote = escapeHtml(t.dataNote.replace("{hours}", String(options.hours)));

  return `<!doctype html>
<html lang="${options.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<meta name="theme-color" content="#0b0b12">
<title>YTDescGen · ${escapeHtml(t.heading)}</title>
<meta name="description" content="${escapeHtml(t.metaDescription)}">
<link rel="canonical" href="${origin}/">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="YTDescGen">
<meta property="og:title" content="YTDescGen — YouTube Title, Description &amp; Tag Generator">
<meta property="og:description" content="${escapeHtml(t.metaDescription)}">
<meta property="og:url" content="${origin}/">
<meta property="og:image" content="${origin}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${origin}/og-image.png">
<style>${STYLES}</style>
</head>
<body>
<main aria-labelledby="gate-title">
<div class="brand">${LOGO_SVG}<span>YTDescGen</span></div>
<h1 id="gate-title">${escapeHtml(t.heading)}</h1>
<p class="lead">${escapeHtml(t.lead)}</p>
<div id="ts"></div>
${consentBlock}
<button id="enter" type="button" disabled>${escapeHtml(t.enter)}</button>
<p id="status" class="status" role="status" aria-live="polite"></p>
<noscript><p class="status err">${escapeHtml(t.noscript)}</p></noscript>
<p class="note">${dataNote}</p>
</main>
<footer>${escapeHtml(t.protectedBy)} · ${link(legalDocPath("privacy"), t.privacyLink)} · ${link(legalDocPath("terms"), t.termsLink)} · ${link(legalDocPath("security"), t.security)}</footer>
<script id="ytg-gate" type="application/json">${scriptJson(config)}</script>
<script nonce="${options.nonce}">${CLIENT_SCRIPT}</script>
</body>
</html>`;
}
