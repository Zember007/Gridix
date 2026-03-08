import { useCallback, useEffect, useMemo, useState } from "react";
import { useUserProjects } from "@gridix/utils";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
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
import { AmoCRMProjectRow } from "./AmoCRMProjectRow";

export const AmoCRMProjectList = ({
  connection,
  open,
}: AmoCRMProjectListProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [settingsByProjectId, setSettingsByProjectId] = useState<
    Record<string, ProjectCRMSettings | null>
  >({});
  const [amoData, setAmoData] = useState<AmoCRMData | null>(null);

  const ownerUserId = activeWorkspaceId ?? user?.id ?? null;
  const { refetch: refetchProjects } = useUserProjects(ownerUserId, false);
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
    if (!open || !ownerUserId || !connection?.id) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [projectsResponse, nextAmoData] = await Promise.all([
          refetchProjects(),
          fetchAmoData(),
        ]);

        if (projectsResponse.error) throw projectsResponse.error;
        const nextProjects = (projectsResponse.data ?? []).map((project) => ({
          id: project.id,
          name: project.name,
          created_at: project.created_at,
        }));

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
  }, [open, ownerUserId, connection?.id, refreshAllSettings, refetchProjects]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
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
