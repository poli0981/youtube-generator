import { useTranslation } from "react-i18next";
import { ValidatedInput } from "@components/ui/ValidatedInput";
import { useEditorStore } from "@store/editor-store";
import { validateMessengerUrl, validateZaloGroupUrl } from "@utils/validation";

/**
 * Community invite links (v0.32.0). A single section for "join the chat"
 * links that feed the description's "💬 COMMUNITY" block:
 *
 *  - Messenger community (`https://m.me/ch/<id>`) — shown for every output
 *    language.
 *  - Zalo group (`https://zalo.me/g/<code>`) — Zalo is a Vietnam-audience
 *    app, so the input only appears (and the description line only renders)
 *    when the output language is Vietnamese. A value entered while in
 *    Vietnamese is preserved if the creator later switches language.
 *
 * Both inputs hard-reject malformed links via {@link ValidatedInput}, so a
 * bad URL never reaches the generated description.
 */
export function CommunityEditor() {
  const { t } = useTranslation("ui");
  const messengerCommunityLink = useEditorStore((s) => s.messengerCommunityLink);
  const zaloGroupLink = useEditorStore((s) => s.zaloGroupLink);
  const language = useEditorStore((s) => s.language);
  const setField = useEditorStore((s) => s.set);

  const isVi = language === "vi";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-secondary">
          {t("editor.community")}
        </span>
        <p className="text-xs text-text-muted">{t("editor.communityHelp")}</p>
      </div>

      <ValidatedInput
        label={t("editor.messengerCommunityLink")}
        placeholder={t("editor.messengerCommunityLinkPlaceholder")}
        value={messengerCommunityLink}
        onChange={(v) => setField("messengerCommunityLink", v)}
        validate={validateMessengerUrl}
        inputMode="url"
        autoComplete="off"
      />

      {isVi && (
        <ValidatedInput
          label={t("editor.zaloGroupLink")}
          placeholder={t("editor.zaloGroupLinkPlaceholder")}
          value={zaloGroupLink}
          onChange={(v) => setField("zaloGroupLink", v)}
          validate={validateZaloGroupUrl}
          inputMode="url"
          autoComplete="off"
        />
      )}
    </div>
  );
}
