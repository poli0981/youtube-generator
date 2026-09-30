import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentTitle } from "@hooks/use-document-title";
import { Download, Upload } from "lucide-react";
import { Button } from "@components/ui/Button";
import { Badge } from "@components/ui/Badge";
import { PageContainer, PageHeader } from "@components/ui/PageHeader";
import { TabPanel, Tabs } from "@components/ui/Tabs";
import { ProfileList } from "@components/profiles/ProfileList";
import { PresetList } from "@components/presets/PresetList";
import { TemplateList } from "@components/templates/TemplateList";
import { useProfileStore } from "@store/profile-store";
import { usePresetStore } from "@store/preset-store";
import { useTemplateStore } from "@store/template-store";
import { useFileExport } from "@hooks/use-file-export";
import { useStrictBlock } from "@hooks/use-strict-block";
import { saveTextFile } from "@utils/file-ops";
import { datedFileName } from "@utils/backup/format";
import { collectSection } from "@utils/backup/collect";
import { pickFileToRestore } from "@utils/backup/restore-flow";

type Tab = "profiles" | "presets" | "templates";

export function ProfilesPage() {
  const { t } = useTranslation("ui");
  useDocumentTitle(t("tabs.profiles"));
  const { report } = useFileExport();
  // Strict Mode gates exports of editor-derived data so a known-bad URL
  // doesn't get baked into a profile the user then reuses everywhere.
  const strictBlocked = useStrictBlock();
  const [tab, setTab] = useState<Tab>("profiles");
  const profiles = useProfileStore((st) => st.profiles);
  const presets = usePresetStore((st) => st.presets);
  const templates = useTemplateStore((st) => st.templates);

  // Every file goes through the same restore preview, whichever tab opened
  // it — a presets file picked on the Profiles tab still lands in presets.
  const exportTab = async () => {
    // Built before the first await: the web file picker needs the click's
    // user activation, which an earlier await would spend.
    const content = JSON.stringify(collectSection(tab), null, 2);
    report(await saveTextFile({ content, filename: datedFileName(tab, "json") }));
  };

  const actions: Record<Tab, { exportLabel: string; importLabel: string }> = {
    profiles: {
      exportLabel: t("profiles.exportProfiles"),
      importLabel: t("profiles.importProfiles"),
    },
    presets: {
      exportLabel: t("presets.exportPresets"),
      importLabel: t("presets.importPresets"),
    },
    templates: {
      exportLabel: t("templates.exportTemplates"),
      importLabel: t("templates.importTemplates"),
    },
  };
  const current = actions[tab];
  const count = (n: number) => (n > 0 ? <Badge>{n}</Badge> : null);

  return (
    <PageContainer width="narrow">
      <PageHeader
        title={t("tabs.profiles")}
        description={t("profiles.intro")}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => void pickFileToRestore()}>
              <Upload />
              {current.importLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void exportTab()}
              disabled={strictBlocked}
            >
              <Download />
              {current.exportLabel}
            </Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        ariaLabel={t("tabs.profiles")}
        layoutId="library-tab"
        items={[
          { value: "profiles", label: t("profiles.title"), badge: count(profiles.length) },
          { value: "presets", label: t("presets.title"), badge: count(presets.length) },
          { value: "templates", label: t("templates.title"), badge: count(templates.length) },
        ]}
      >
        <TabPanel value="profiles" className="pt-4">
          <ProfileList />
        </TabPanel>
        <TabPanel value="presets" className="pt-4">
          <PresetList />
        </TabPanel>
        <TabPanel value="templates" className="pt-4">
          <TemplateList />
        </TabPanel>
      </Tabs>
    </PageContainer>
  );
}
