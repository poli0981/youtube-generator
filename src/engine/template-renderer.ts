import type { GeneratorInput, GeneratorOutput, TranslationFn, CharLimitWarning } from "./types";
import { buildTitle, checkTitleWarning } from "./title-builder";
import { buildDescription, checkDescriptionWarning } from "./description-builder";
import { generateTags, formatTagString } from "./tag-generator";
import { YT_LIMITS } from "./types";

export function renderAll(input: GeneratorInput, t: TranslationFn): GeneratorOutput {
  const title = buildTitle(input, t);
  const description = buildDescription(input, t);
  const tags = generateTags(input);
  const tagString = formatTagString(tags);

  const charCounts = {
    title: title.length,
    description: description.length,
    tags: tagString.length,
  };

  const warnings: CharLimitWarning[] = [];

  const titleWarning = checkTitleWarning(title);
  if (titleWarning) warnings.push(titleWarning);

  const descWarning = checkDescriptionWarning(description);
  if (descWarning) warnings.push(descWarning);

  if (tagString.length > YT_LIMITS.TAGS_MAX) {
    warnings.push({
      field: "tags",
      current: tagString.length,
      limit: YT_LIMITS.TAGS_MAX,
      message: `Tags exceed ${YT_LIMITS.TAGS_MAX} characters (${tagString.length}/${YT_LIMITS.TAGS_MAX})`,
    });
  }

  return {
    title,
    description,
    tags,
    tagString,
    charCounts,
    warnings,
  };
}
