import { toast } from "sonner";
import i18n from "@i18n/index";
import { PLATFORMS } from "@config/platforms";
import { useEditorStore } from "@store/editor-store";
import { extractGameNameFromUrl } from "./url-extractors";

/**
 * Paste a store link anywhere in the editor — the page, the Game name field,
 * or the wrong store's field — and it lands in the right store field. The
 * first store link of a game also sets the platform, and an empty Game name
 * is filled from the link ("final-fantasy-vii-remake" → "Final Fantasy VII
 * Remake"). One toast, one Undo.
 */

export interface StoreLinkMatch {
  platformId: string;
  label: string;
  /** As saved: normalised by the platform (Steam drops tracking parameters). */
  url: string;
  /** As pasted — the game name is read from this. */
  pasted: string;
}

/** A pasted text that is exactly one store link, or null. */
export function matchStoreLink(text: string): StoreLinkMatch | null {
  const pasted = text.trim();
  if (!/^https:\/\/\S+$/.test(pasted)) return null;
  // The publisher entry accepts any https URL; it isn't a store to route to.
  const platform = PLATFORMS.find((p) => p.id !== "publisher" && p.urlPattern.test(pasted));
  if (!platform) return null;
  return {
    platformId: platform.id,
    label: platform.label,
    url: platform.normalize ? platform.normalize(pasted) : pasted,
    pasted,
  };
}

export function applyStoreLink(match: StoreLinkMatch): void {
  const t = (key: string, options?: Record<string, unknown>) =>
    i18n.t(key, { ns: "ui", ...options });
  const editor = useEditorStore.getState();
  const before = {
    storeLinks: { ...editor.storeLinks },
    platform: editor.platform,
    gameName: editor.gameName,
  };

  editor.setNested("storeLinks", match.platformId, match.url);
  const firstLink = !Object.entries(before.storeLinks).some(
    ([id, url]) => id !== match.platformId && url.trim() !== "",
  );
  if (firstLink) editor.set("platform", match.platformId);
  const name = before.gameName.trim() ? null : extractGameNameFromUrl(match.pasted);
  if (name) editor.set("gameName", name);

  toast.success(
    name
      ? t("editor.paste.linkAndName", { store: match.label, name })
      : t("editor.paste.link", { store: match.label }),
    {
      duration: 6000,
      action: {
        label: t("common.undo"),
        onClick: () => useEditorStore.setState(before),
      },
    },
  );
}

/** True for a focused element the user types into. */
export function isTypingTarget(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false;
  const tag = element.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || element.isContentEditable;
}
