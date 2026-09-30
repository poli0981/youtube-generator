/**
 * The gate cookie: proof that this browser passed Turnstile recently.
 *
 * Format: `v1.<expiresAt>.<uaHash>.<signature>`
 *
 *  - `expiresAt` — Unix seconds; checked on every request.
 *  - `uaHash`    — first 16 base64url chars of SHA-256(User-Agent). Binds the
 *                  cookie to the browser that solved the challenge, so a
 *                  cookie lifted into a scraper with a different UA is dead.
 *                  A browser update changes the UA and simply re-shows the
 *                  gate, which is cheap.
 *  - signature   — HMAC-SHA256 over `v1.<expiresAt>.<uaHash>`.
 *
 * The HMAC key is derived from the Turnstile secret (HMAC(secret, label)), so
 * the deployment needs no second secret, and rotating the Turnstile secret
 * invalidates every outstanding gate cookie as a side effect.
 */

const encoder = new TextEncoder();
const KEY_LABEL = "ytg-gate-v1";

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  const padded = text.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((text.length + 3) % 4);
  try {
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

const keyCache = new Map<string, Promise<CryptoKey>>();

/** The HMAC key for gate cookies, derived once per secret per isolate. */
export function deriveGateKey(secret: string): Promise<CryptoKey> {
  let key = keyCache.get(secret);
  if (!key) {
    key = (async () => {
      const master = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const derived = await crypto.subtle.sign("HMAC", master, encoder.encode(KEY_LABEL));
      return crypto.subtle.importKey("raw", derived, { name: "HMAC", hash: "SHA-256" }, false, [
        "sign",
        "verify",
      ]);
    })();
    keyCache.set(secret, key);
  }
  return key;
}

export async function userAgentHash(userAgent: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(userAgent));
  return toBase64Url(new Uint8Array(digest)).slice(0, 16);
}

export async function signGateToken(
  key: CryptoKey,
  expiresAt: number,
  uaHash: string,
): Promise<string> {
  const payload = `v1.${expiresAt}.${uaHash}`;
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

/** True only for an unexpired, untampered token minted for this User-Agent. */
export async function verifyGateToken(
  key: CryptoKey,
  token: string,
  nowSeconds: number,
  uaHash: string,
): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [version, expiresRaw, tokenUa, signatureRaw] = parts as [string, string, string, string];
  if (version !== "v1" || !/^\d{1,12}$/.test(expiresRaw)) return false;
  if (Number(expiresRaw) <= nowSeconds) return false;
  if (tokenUa !== uaHash) return false;
  const signature = fromBase64Url(signatureRaw);
  if (!signature) return false;
  return crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(`${version}.${expiresRaw}.${tokenUa}`),
  );
}

/** Read one cookie out of a `Cookie` request header. */
export function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}
