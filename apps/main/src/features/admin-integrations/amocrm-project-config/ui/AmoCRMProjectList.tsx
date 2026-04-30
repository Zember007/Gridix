import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAccess } from "@/entities/admin-access";
import {
  fetchAmoData,
  fetchProjectSettingsBulk,
  fetchProjectSettingsSingle,
} from "../api/amocrm-project-config-api";
import type {
  AmoCRMData,
  AmoCRMProjectListProps,
  Project,
  ProjectCRMSettings,
} from "../model/types";
import { CrmProjectConfigListSkeleton } from "@/features/admin-integrations/ui/CrmProjectConfigListSkeleton";
import { AmoCRMProjectRow } from "./AmoCRMProjectRow";

export const AmoCRMProjectList = ({
  connection,
  open,
}: AmoCRMProjectListProps) => {
  const { t } = useLanguage();
  const adminAccess = useAdminAccess();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsByProjectId, setSettingsByProjectId] = useState<
    Record<string, ProjectCRMSettings | null>
  >({});
  const [amoData, setAmoData] = useState<AmoCRMData | null>(null);

  const projectIds = useMemo(
    () => projects.map((project) => project.id),
    [projects],
  );

  const refreshAllSettings = useCallback(
    async (ids: string[]) => {
      if (!connection?.id) return;
      if (!ids.length) {
        setSettingsByProjectId({});
        return;
      }

      const rows = await fetchProjectSettingsBulk(connection.id, ids);
      const map: Record<string, ProjectCRMSettings | null> = {};
      for (const id of ids) map[id] = null;
      for (const row of rows) {
        if (row?.project_id) {
          map[row.project_id] = row;
        }
      }
      setSettingsByProjectId(map);
    },
    [connection?.id],
  );

  const refreshProjectSettings = useCallback(
    async (projectId: string) => {
      if (!connection?.id || !projectId) return;
      const row = await fetchProjectSettingsSingle(connection.id, projectId);
      setSettingsByProjectId((prev) => ({
        ...prev,
        [projectId]: row,
      }));
    },
    [connection?.id],
  );

  useEffect(() => {
    if (!open || !connection?.id) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const nextProjects = (adminAccess?.proProjects ?? []).map(
          (project) => ({
            id: project.id,
            name: project.name,
            created_at: project.created_at,
          }),
        );
        const nextAmoData = await fetchAmoData();

        setProjects(nextProjects);
        setAmoData(nextAmoData);
        await refreshAllSettings(nextProjects.map((project) => project.id));
      } catch (error) {
        console.error("Error fetching AmoCRM projects/settings:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchAll();
  }, [adminAccess?.proProjects, connection?.id, open, refreshAllSettings]);

  if (loading) {
    return <CrmProjectConfigListSkeleton />;
  }

  if (!projectIds.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        {t("projectList.noProjects")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {projects.map((project) => (
          <AmoCRMProjectRow
            key={project.id}
            project={project}
            connection={connection}
            amoData={amoData}
            settings={settingsByProjectId[project.id] ?? null}
            refreshSettings={() => refreshProjectSettings(project.id)}
          />
        ))}
      </div>
    </div>
  );
};
