import { useEffect, useState } from "react";
import { useUserProjects } from "@gridix/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import type { Bitrix24ProjectListProps, Project } from "../model/types";
import { CrmProjectConfigListSkeleton } from "@/features/admin-integrations/ui/CrmProjectConfigListSkeleton";
import { Bitrix24ProjectRow } from "./Bitrix24ProjectRow";

export const Bitrix24ProjectList = ({
  connection,
  open,
}: Bitrix24ProjectListProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const ownerUserId = activeWorkspaceId ?? user?.id ?? null;
  const { refetch: refetchProjects } = useUserProjects(ownerUserId, false);

  useEffect(() => {
    if (!open || !connection?.id || !ownerUserId) return;

    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await refetchProjects();
        if (response.error) throw response.error;
        const normalized = (response.data ?? []).map((project) => ({
          id: project.id,
          name: project.name,
          created_at: project.created_at,
        }));
        setProjects(normalized);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchProjects();
  }, [open, connection?.id, ownerUserId, refetchProjects]);

  if (loading) {
    return <CrmProjectConfigListSkeleton />;
  }
  if (!projects.length) {
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
          <Bitrix24ProjectRow
            key={project.id}
            project={project}
            connection={connection}
          />
        ))}
      </div>
    </div>
  );
};
