import { useTranslation } from "react-i18next";
import { ChipGroup } from "@components/ui/ChipGroup";
import { GENRES } from "@config/genres";
import { useEditorStore } from "@store/editor-store";

export function GenreSelector() {
  const { t } = useTranslation("ui");
  const genre = useEditorStore((s) => s.genre);
  const set = useEditorStore((s) => s.set);

  const options = GENRES.map((g) => ({
    id: g.id,
    label: t(g.labelKey),
    icon: g.icon,
  }));

  return (
    <ChipGroup
      label={t("editor.genre")}
      options={options}
      value={genre}
      onChange={(v) => set("genre", v as typeof genre)}
    />
  );
}
