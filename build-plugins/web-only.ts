import type { Plugin } from "vite";
import { SITE_ORIGIN } from "../src/config/brand.ts";
import { legalDocPath } from "../src/config/legal.ts";

/**
 * Build steps that only make sense for the web deployment on
 * ytgenerator.stream — never for the Tauri desktop / Android bundles, which
 * stay free of network beacons (their CSP would block them anyway).
 */

/**
 * The Cloudflare Web Analytics snippet, byte-for-byte as issued for this
 * site. Cookieless; allowed by the app shell's CSP (worker/headers.ts).
 */
export const CF_WEB_ANALYTICS_SNIPPET = `<!-- Cloudflare Web Analytics -->
<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "84187c3714aa49e1ad8ef93ad6d422e7"}'>
</script>
<!-- End Cloudflare Web Analytics -->`;

export function cloudflareWebAnalytics(): Plugin {
  return {
    name: "ytdescgen:cf-web-analytics",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace("</body>", `${CF_WEB_ANALYTICS_SNIPPET}\n  </body>`);
      },
    },
  };
}

/** Days until the generated security.txt expires (RFC 9116 wants < 1 year). */
export const SECURITY_TXT_LIFETIME_DAYS = 180;

/**
 * RFC 9116 security.txt, regenerated on every build so `Expires` always sits
 * ~6 months ahead of the last deploy instead of silently lapsing.
 */
export function renderSecurityTxt(now: Date): string {
  const expires = new Date(now.getTime() + SECURITY_TXT_LIFETIME_DAYS * 86_400_000);
  return [
    "# Security contact for YTDescGen — https://ytgenerator.stream",
    "# Scope, response times and disclosure policy are in the Policy link below.",
    "Contact: mailto:security@poli0981.dev",
    "Contact: https://github.com/poli0981/youtube-generator/security/advisories/new",
    `Expires: ${expires.toISOString().replace(/\.\d{3}Z$/, "Z")}`,
    "Preferred-Languages: en, vi",
    `Canonical: ${SITE_ORIGIN}/.well-known/security.txt`,
    `Policy: ${SITE_ORIGIN}${legalDocPath("security")}`,
    "",
  ].join("\n");
}

export function securityTxt(): Plugin {
  return {
    name: "ytdescgen:security-txt",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: ".well-known/security.txt",
        source: renderSecurityTxt(new Date()),
      });
    },
  };
}
