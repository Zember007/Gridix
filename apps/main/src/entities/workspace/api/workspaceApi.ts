import { supabase } from "@gridix/utils/api";
import type { Project } from "@/entities/project/api/projectApi";

export interface WorkspaceProjectsParams {
  userId: string;
  activeWorkspaceId: string | null;
  isManagerMode: boolean;
}

export const fetchWorkspaceProjects = async (
  params: WorkspaceProjectsParams
): Promise<Project[]> => {
  const { userId, activeWorkspaceId, isManagerMode } = params;

  if (isManagerMode && activeWorkspaceId) {
    const { data: managerAccount } = await supabase
      .from("manager_accounts")
      .select("id")
      .eq("manager_id", userId)
      .eq("developer_id", activeWorkspaceId)
      .eq("status", "active")
      .single();

    if (!managerAccount) {
      return [];
    }

    const { data: accessRules } = await supabase
      .from("manager_project_access")
      .select("project_id")
      .eq("manager_account_id", managerAccount.id);

    let query = supabase
      .from("projects")
      .select(
        `
        *,
        user_profiles!fk_projects_user_profile (
          full_name,
          company_name
        )
      `
      )
      .eq("user_id", activeWorkspaceId);

    if (accessRules && accessRules.length > 0) {
      const projectIds = accessRules.map((r) => r.project_id);
      query = query.in("id", projectIds);
    }

    const { data: projectsData, error: projectsError } = await query.order("created_at", {
      ascending: false,
    });

    if (projectsError) throw projectsError;

    const projectsWithDeveloper = (projectsData || []).map((project: any) => ({
      ...project,
      developer_info: project.user_profiles,
    }));

    return projectsWithDeveloper as Project[];
  }

  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (projectsError) throw projectsError;

  return (projectsData || []) as Project[];
};
