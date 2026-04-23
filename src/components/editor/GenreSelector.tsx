import { useTranslation } from "react-i18next";
import { ChipGroup } from "@components/ui/ChipGroup";
import { GENRES } from "@config/genres";
import { useEditorStore } from "@store/editor-store";
import { MAX_GENRES, type Genre } from "@engine/types";

export function GenreSelector() {
  const { t } = useTranslation("ui");
  const genres = useEditorStore((s) => s.genres);
  const set = useEditorStore((s) => s.set);

  const options = GENRES.map((g) => ({
    id: g.id,
    label: t(g.labelKey),
    icon: g.icon,
  }));

  return (
    <ChipGroup
      label={t("editor.genre")}
      multiple
      max={MAX_GENRES}
      options={options}
      value={genres}
      onChange={(next) => set("genres", next as Genre[])}
    />
  );
}
