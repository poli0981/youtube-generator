import { useTranslation } from "react-i18next";
import { Input } from "@components/ui/Input";
import { Textarea } from "@components/ui/Textarea";
import { VIDEO_TYPES } from "@config/video-types";
import {
  GACHA_QUEST_TYPE_GROUPS,
  GACHA_QUEST_FIELD_VISIBILITY,
  GACHA_QUEST_PLACEHOLDERS,
  DEFAULT_GACHA_QUEST_TYPE,
  type GachaQuestType,
} from "@config/gacha-quest-types";
import { useEditorStore } from "@store/editor-store";

const ANNIVERSARY_YEARS = Array.from({ length: 20 }, (_, i) => i + 1);

/**
 * Renders inputs for the extra fields required by the currently selected
 * video type — e.g. "Part Number" for `part`, "Boss Name" for `boss`,
 * "Mod Name" for `mods`. Returns null when the video type has no extras,
 * so the caller doesn't have to conditionally render.
 */
export function ExtraFieldsInput() {
  const { t } = useTranslation("ui");
  const store = useEditorStore();

  const currentVideoType = VIDEO_TYPES.find((vt) => vt.id === store.videoType);
  const extraFields: readonly string[] = currentVideoType?.extraFields ?? [];
  if (extraFields.length === 0) return null;

  const isGacha = store.videoType === "gacha_quest";
  const questType = (store.gachaQuestType ?? DEFAULT_GACHA_QUEST_TYPE) as GachaQuestType;
  const visibility = GACHA_QUEST_FIELD_VISIBILITY[questType];
  const placeholders = GACHA_QUEST_PLACEHOLDERS[questType];

  const placeholderFor = (field: "chapterName" | "questName" | "partNumber"): string => {
    const key = `editor.placeholders.questType.${questType}.${field}`;
    const localised = t(key);
    if (localised && localised !== key) return localised;
    const fromMap = placeholders[field];
    if (fromMap) return fromMap;
    return t(`editor.${field}Placeholder`);
  };

  // For non-gacha video types, the original visibility logic still applies
  // — every extraField listed renders. Only gacha-quest gates the trio
  // through `GACHA_QUEST_FIELD_VISIBILITY` plus the new char/year/version
  // fields.
  const showField = (id: "chapterName" | "questName" | "partNumber"): boolean => {
    if (!extraFields.includes(id)) return false;
    if (!isGacha) return true;
    return visibility[id];
  };

  return (
    <div className="flex flex-col gap-3">
      {extraFields.includes("gachaQuestType") && (
        <div className="flex flex-col gap-1">
          <label htmlFor="gacha-quest-type" className="text-sm font-medium text-text-secondary">
            {t("editor.gachaQuestType")}
          </label>
          <select
            id="gacha-quest-type"
            value={store.gachaQuestType ?? "main_story"}
            onChange={(e) => store.set("gachaQuestType", e.target.value as GachaQuestType)}
            className="focus:ring-accent/50 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-2"
          >
            {GACHA_QUEST_TYPE_GROUPS.map((g) => (
              <optgroup key={g.group} label={t(`editor.gachaQuestTypeGroups.${g.group}`)}>
                {g.members.map((m) => (
                  <option key={m} value={m}>
                    {t(`editor.gachaQuestTypeOptions.${m}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      )}
      {isGacha && visibility.characterName && (
        <Input
          label={t("editor.characterName")}
          placeholder={t("editor.characterNamePlaceholder")}
          value={store.characterName ?? ""}
          onChange={(e) => store.set("characterName", e.target.value)}
        />
      )}
      {isGacha && visibility.anniversaryYear && (
        <div className="flex flex-col gap-1">
          <label htmlFor="anniversary-year" className="text-sm font-medium text-text-secondary">
            {t("editor.anniversaryYear")}
          </label>
          <select
            id="anniversary-year"
            value={store.anniversaryYear ?? ""}
            onChange={(e) =>
              store.set("anniversaryYear", e.target.value === "" ? null : Number(e.target.value))
            }
            className="focus:ring-accent/50 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary transition-colors focus:border-accent focus:outline-none focus:ring-2"
          >
            <option value="">—</option>
            {ANNIVERSARY_YEARS.map((y) => (
              <option key={y} value={y}>
                {t("editor.anniversaryYearOption", { count: y })}
              </option>
            ))}
          </select>
        </div>
      )}
      {showField("chapterName") && (
        <Input
          label={t("editor.chapterName")}
          placeholder={isGacha ? placeholderFor("chapterName") : t("editor.chapterNamePlaceholder")}
          value={store.chapterName ?? ""}
          onChange={(e) => store.set("chapterName", e.target.value)}
        />
      )}
      {showField("questName") && (
        <Input
          label={t("editor.questName")}
          placeholder={isGacha ? placeholderFor("questName") : t("editor.questNamePlaceholder")}
          value={store.questName ?? ""}
          onChange={(e) => store.set("questName", e.target.value)}
        />
      )}
      {showField("partNumber") && (
        <Input
          label={t("editor.partNumber")}
          placeholder={isGacha ? placeholderFor("partNumber") : t("editor.partNumberPlaceholder")}
          value={store.partNumber ?? ""}
          onChange={(e) => store.set("partNumber", e.target.value)}
        />
      )}
      {isGacha && (
        <Input
          label={t("editor.gachaVersion")}
          placeholder={t("editor.gachaVersionPlaceholder")}
          value={store.gachaVersion ?? ""}
          onChange={(e) => store.set("gachaVersion", e.target.value)}
        />
      )}
      {extraFields.includes("bossName") && (
        <Input
          label={t("editor.bossName")}
          placeholder={t("editor.bossNamePlaceholder")}
          value={store.bossName ?? ""}
          onChange={(e) => store.set("bossName", e.target.value)}
        />
      )}
      {extraFields.includes("dlcName") && (
        <Input
          label={t("editor.dlcName")}
          placeholder={t("editor.dlcNamePlaceholder")}
          value={store.dlcName ?? ""}
          onChange={(e) => store.set("dlcName", e.target.value)}
        />
      )}
      {extraFields.includes("challengeName") && (
        <Input
          label={t("editor.challengeName")}
          placeholder={t("editor.challengeNamePlaceholder")}
          value={store.challengeName ?? ""}
          onChange={(e) => store.set("challengeName", e.target.value)}
        />
      )}
      {extraFields.includes("modName") && (
        <>
          <Input
            label={t("editor.modName")}
            placeholder={t("editor.modNamePlaceholder")}
            value={store.modName ?? ""}
            onChange={(e) => store.set("modName", e.target.value)}
          />
          <Textarea
            label={t("editor.modList")}
            placeholder={t("editor.modListPlaceholder")}
            value={store.modList ?? ""}
            onChange={(e) => store.set("modList", e.target.value)}
            rows={5}
          />
        </>
      )}
      {extraFields.includes("liveUrl") && (
        <Input
          label={t("editor.liveUrl")}
          placeholder={t("editor.liveUrlPlaceholder")}
          value={store.liveUrl ?? ""}
          onChange={(e) => store.set("liveUrl", e.target.value)}
        />
      )}
      {extraFields.includes("scheduledTime") && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-secondary">
            {t("editor.scheduledTime")}
          </label>
          <input
            type="datetime-local"
            value={store.scheduledTime ?? ""}
            onChange={(e) => store.set("scheduledTime", e.target.value)}
            className="focus:ring-accent/50 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2"
          />
        </div>
      )}
    </div>
  );
}
