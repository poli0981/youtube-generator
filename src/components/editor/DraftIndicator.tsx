import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, m } from "motion/react";
import { CloudCheck } from "lucide-react";
import { useEditorStore } from "@store/editor-store";

/**
 * "Draft saved", briefly, after each edit. It subscribes to the store instead
 * of watching fields, so it only reacts to real edits — the old version also
 * flashed every time the Editor page mounted.
 */
export function DraftIndicator() {
  const { t } = useTranslation("ui");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useEditorStore.subscribe(() => {
      setVisible(true);
      clearTimeout(hide);
      hide = setTimeout(() => setVisible(false), 1600);
    });
    return () => {
      unsubscribe();
      clearTimeout(hide);
    };
  }, []);

  return (
    <span className="inline-flex h-5 items-center" aria-live="polite">
      <AnimatePresence>
        {visible && (
          <m.span
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-success inline-flex items-center gap-1 text-xs font-medium"
          >
            <CloudCheck className="size-3.5" aria-hidden="true" />
            {t("editor.draftSaved")}
          </m.span>
        )}
      </AnimatePresence>
    </span>
  );
}
