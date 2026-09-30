import type { SupportedLanguage } from "./types";

/**
 * Sentences that name the channel ("…of Hades on {{channelName}}.") without
 * a channel name.
 *
 * Every intro, greeting and playlist line interpolates `{{channelName}}`, so
 * an empty channel produced "This video features the full gameplay of Hades
 * on ." Templates render with {@link CHANNEL_SLOT} in the channel's place,
 * then {@link withoutEmptyChannel} drops the words that only made sense with
 * a name — "on", "trên kênh", "による"… — per language.
 */

/** Stands in for an empty channel name while a template renders. */
export const CHANNEL_SLOT = "@@CHANNEL@@";

/** The channel name, or the slot when there is none. */
export function channelOrSlot(channelName: string): string {
  return channelName.trim() || CHANNEL_SLOT;
}

const S = CHANNEL_SLOT;

/** The words around the channel name that go with it, per language. */
const DROP: Record<SupportedLanguage, readonly RegExp[]> = {
  en: [],
  vi: [new RegExp(`\\s+(?:trên kênh|trên|cùng) ${S}`, "g")],
  ja: [new RegExp(`${S}\\s*(?:による|にて|での|で|の)\\s*`, "g")],
  es: [new RegExp(`\\s+en ${S}`, "g")],
  ko: [new RegExp(`${S}\\s*(?:채널의|에서|의)\\s*`, "g")],
  zh: [
    new RegExp(`${S}\\s*频道\\s*`, "g"),
    new RegExp(`在\\s*${S}\\s*`, "g"),
    new RegExp(`${S}\\s*的\\s*`, "g"),
  ],
  "pt-BR": [new RegExp(`\\s+no ${S}`, "g")],
  id: [new RegExp(`\\s+(?:di|pada) ${S}`, "g")],
};

/** Some locales still carry English sentences for newer video types. */
const ENGLISH = new RegExp(`\\s+on ${S}`, "g");

/** For a sentence shape none of the patterns covers: a neutral stand-in. */
const FALLBACK: Record<SupportedLanguage, string> = {
  en: "this channel",
  vi: "kênh",
  ja: "チャンネル",
  es: "este canal",
  ko: "채널",
  zh: "我们",
  "pt-BR": "este canal",
  id: "kanal ini",
};

/** `text` without the channel phrase, when it was rendered with {@link CHANNEL_SLOT}. */
export function withoutEmptyChannel(text: string, language: SupportedLanguage): string {
  if (!text.includes(CHANNEL_SLOT)) return text;
  let out = text;
  for (const pattern of [...DROP[language], ENGLISH]) out = out.replace(pattern, "");
  out = out.split(CHANNEL_SLOT).join(FALLBACK[language]);
  return out.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+([.,!?。！？])/g, "$1");
}
